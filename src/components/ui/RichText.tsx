"use client";

import React, { Fragment, useState } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

// Lexical Format Constants
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE = 8;
const IS_CODE = 16;
const IS_SUBSCRIPT = 32;
const IS_SUPERSCRIPT = 64;

type Node = {
  type: string;
  value?: {
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
    id?: string;
  };
  children?: Node[];
  url?: string;
  [key: string]: unknown;
  text?: string;
  format?: number | string;
  indent?: number;
  version?: number;
};

// Graceful image component — shows placeholder on error instead of crashing
const SafeImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground">
        <ImageOff className="w-8 h-8 opacity-50" />
        <span className="text-xs">Gambar tidak tersedia</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

export const RichText = React.memo(({
  content,
  className,
}: {
  content: { root: Node } | any; // eslint-disable-line @typescript-eslint/no-explicit-any
  className?: string;
}) => {
  if (!content?.root?.children) return null;

  return (
    <div className={cn("prose dark:prose-invert max-w-none text-foreground break-words", className)}>
      {serialize(content.root.children)}
    </div>
  );
});

RichText.displayName = "RichText";

function getAlignmentClass(node: Node): string {
  if (node.format === 'left' || node.textAlign === 'left') return 'text-left';
  if (node.format === 'center' || node.textAlign === 'center') return 'text-center';
  if (node.format === 'right' || node.textAlign === 'right') return 'text-right';
  if (node.format === 'justify' || node.textAlign === 'justify') return 'text-justify';
  return '';
}

const inlineTypes = new Set(["text", "link", "linebreak", "br"]);

function hasBlockChildren(children: Node[] = []) {
  return children.some((child) => {
    if (!child || typeof child !== "object") return false;
    const type = String(child.type || "");
    return type !== "" && !inlineTypes.has(type);
  });
}

function serialize(children: Node[]): React.ReactNode {
  return children.map((node, i) => {
    if (React.isValidElement(node)) {
      return React.cloneElement(node, { key: i });
    }

    if (!node) {
      return null;
    }

    // Text Nodes
    if (node.type === 'text') {
      let text = <span key={i} dangerouslySetInnerHTML={{ __html: escapeHTML(node.text || "") }} />;
      
      const format = node.format;
      if (typeof format === 'number') {
        if (format & IS_BOLD) {
          text = <strong key={i}>{text}</strong>;
        }
        if (format & IS_ITALIC) {
          text = <em key={i}>{text}</em>;
        }
        if (format & IS_STRIKETHROUGH) {
          text = <span key={i} className="line-through">{text}</span>;
        }
        if (format & IS_UNDERLINE) {
          text = <span key={i} className="underline">{text}</span>;
        }
        if (format & IS_CODE) {
          text = <code key={i}>{text}</code>;
        }
        if (format & IS_SUBSCRIPT) {
          text = <sub key={i}>{text}</sub>;
        }
        if (format & IS_SUPERSCRIPT) {
          text = <sup key={i}>{text}</sup>;
        }
      }

      return <Fragment key={i}>{text}</Fragment>;
    }

    // Upload/Image Nodes — graceful fallback on error
    if (node.type === 'upload' && node.value?.url) {
      return (
        <div key={i} className={cn("my-4 relative", getAlignmentClass(node))}>
          <SafeImage
            src={node.value.url}
            alt={node.value.alt || "Image"}
            className="rounded-lg max-w-full h-auto object-contain mx-auto"
          />
        </div>
      );
    }

    // Element Nodes
    const alignment = getAlignmentClass(node);
    const indentClass = node.indent && node.indent > 0 ? `pl-${node.indent * 4}` : '';
    const classes = cn(alignment, indentClass);

    switch (node.type) {
      case 'paragraph':
         if (node.children?.length === 0 || (node.children?.length === 1 && node.children[0].text === '')) {
             return <br key={i} />;
         }
         if (hasBlockChildren(node.children)) {
             return <div key={i} className={classes}>{serialize(node.children || [])}</div>;
         }
         return <p key={i} className={classes}>{serialize(node.children || [])}</p>;
      case 'h1':
        return <h1 key={i} className={classes}>{serialize(node.children || [])}</h1>;
      case 'h2':
        return <h2 key={i} className={classes}>{serialize(node.children || [])}</h2>;
      case 'h3':
        return <h3 key={i} className={classes}>{serialize(node.children || [])}</h3>;
      case 'h4':
        return <h4 key={i} className={classes}>{serialize(node.children || [])}</h4>;
      case 'h5':
        return <h5 key={i} className={classes}>{serialize(node.children || [])}</h5>;
      case 'h6':
        return <h6 key={i} className={classes}>{serialize(node.children || [])}</h6>;
      case 'quote':
        return <blockquote key={i} className={classes}>{serialize(node.children || [])}</blockquote>;
      case 'ul':
        return <ul key={i} className={cn("list-disc pl-5", classes)}>{serialize(node.children || [])}</ul>;
      case 'ol':
        return <ol key={i} className={cn("list-decimal pl-5", classes)}>{serialize(node.children || [])}</ol>;
      case 'li':
        return <li key={i} className={classes}>{serialize(node.children || [])}</li>;
      case 'link':
        return (
          <a
            href={escapeHTML(node.url || "")}
            key={i}
            target={node.newTab ? '_blank' : undefined}
            rel={node.newTab ? 'noopener noreferrer' : undefined}
            className="text-primary underline hover:text-primary/80"
          >
            {serialize(node.children || [])}
          </a>
        );
      case 'block':
          // Handle custom blocks if any (layout blocks etc)
          // For now just serialize children
          return <div key={i}>{serialize(node.children || [])}</div>;

      default:
        // Fallback for unknown types, serialize children
        return <div key={i}>{serialize(node.children || [])}</div>;
    }
  });
}

const escapeHTML = (str: string) =>
  str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      }[tag] || tag)
  );
