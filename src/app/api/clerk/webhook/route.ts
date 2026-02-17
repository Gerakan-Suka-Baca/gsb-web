import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { getPayloadCached } from "@/lib/payload"

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const buildUserSeed = ({
  id,
  email_addresses,
  primary_email_address_id,
  first_name,
  last_name,
}: {
  id: string
  email_addresses: Array<{ id: string; email_address: string }>
  primary_email_address_id?: string | null
  first_name?: string | null
  last_name?: string | null
}) => {
  const primaryEmail = email_addresses.find(email => email.id === primary_email_address_id)?.email_address
  const rawEmail = (primaryEmail ?? email_addresses[0]?.email_address ?? "").trim()
  const email = isValidEmail(rawEmail)
    ? rawEmail
    : `user-${id.replace(/[^a-zA-Z0-9]/g, "-")}@example.com`
  const fullName = `${first_name || ''} ${last_name || ''}`.trim()
  const usernameBase = rawEmail ? rawEmail.split("@")[0] : id
  const username = usernameBase.replace(/\s+/g, "-").slice(0, 64) || id

  return { email, fullName, username }
}

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const eventType = evt.type
  
  const payloadClient = await getPayloadCached()

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, primary_email_address_id } = evt.data
    const { email, fullName, username } = buildUserSeed({
      id,
      email_addresses,
      primary_email_address_id,
      first_name,
      last_name,
    })

    try {
      await payloadClient.create({
        collection: 'users',
        data: {
          clerkUserId: id,
          email,
          fullName,
          roles: ['user'],
          profileCompleted: false,
          username,
        }
      })
    } catch (error) {
      const msg = String(error instanceof Error ? error.message : error)
      const isEmailError = /email|invalid|duplicate|unique/i.test(msg)
      if (!isEmailError) {
        console.error('Error creating user in Payload:', error)
        return new Response('Error creating user', { status: 500 })
      }

      const existingUser = await payloadClient.find({
        collection: 'users',
        where: {
          email: {
            equals: email
          }
        },
        limit: 1
      })

      const existing = existingUser.docs[0] as { id: string; clerkUserId?: string | null; username?: string | null } | undefined
      if (existing && (!existing.clerkUserId || existing.clerkUserId === id)) {
        const updateData: Record<string, unknown> = {
          clerkUserId: id,
          email,
          fullName,
        }
        if (!existing.username) {
          updateData.username = username
        }
        await payloadClient.update({
          collection: 'users',
          id: existing.id,
          data: updateData
        })
        return new Response('', { status: 200 })
      }

      return new Response('Error creating user', { status: 409 })
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, primary_email_address_id } = evt.data
    const { email, fullName, username } = buildUserSeed({
      id,
      email_addresses,
      primary_email_address_id,
      first_name,
      last_name,
    })

    try {
      const existingUser = await payloadClient.find({
        collection: 'users',
        where: {
          clerkUserId: {
            equals: id
          }
        },
        limit: 1
      })

      if (existingUser.docs.length > 0) {
        await payloadClient.update({
          collection: 'users',
          id: existingUser.docs[0].id,
          data: {
            email,
            fullName,
          }
        })
        return new Response('', { status: 200 })
      }

      await payloadClient.create({
        collection: 'users',
        data: {
          clerkUserId: id,
          email,
          fullName,
          roles: ['user'],
          profileCompleted: false,
          username,
        }
      })
    } catch (error) {
      const msg = String(error instanceof Error ? error.message : error)
      const isEmailError = /email|invalid|duplicate|unique/i.test(msg)
      if (!isEmailError) {
        console.error('Error updating user in Payload:', error)
        return new Response('Error updating user', { status: 500 })
      }

      const existingUser = await payloadClient.find({
        collection: 'users',
        where: {
          email: {
            equals: email
          }
        },
        limit: 1
      })

      const existing = existingUser.docs[0] as { id: string; clerkUserId?: string | null } | undefined
      if (existing && (!existing.clerkUserId || existing.clerkUserId === id)) {
        await payloadClient.update({
          collection: 'users',
          id: existing.id,
          data: {
            clerkUserId: id,
            email,
            fullName,
          }
        })
        return new Response('', { status: 200 })
      }

      return new Response('Error updating user', { status: 409 })
    }
  }

  return new Response('', { status: 200 })
}
