import { cookies as getCookies } from "next/headers";

interface Props {
  prefix: string;
  value: string;
}

export const generateAuthCookie = async ({ prefix, value }: Props) => {
  const cookies = await getCookies();
  cookies.set({
    name: `${prefix}-token`,
    value: value,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
};

export const deleteAuthCookie = async (prefix: string) => {
  try {
    const cookies = await getCookies();
    const cookieName = `${prefix || "payload"}-token`;
    
    cookies.set({
      name: cookieName,
      value: "",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
  } catch (error) {
    console.error("Failed to delete auth cookie:", error);
  }
};
