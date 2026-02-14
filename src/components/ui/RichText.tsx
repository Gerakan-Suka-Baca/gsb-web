import React, { Fragment } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
  // Handle string alignment (Payload adapter sometimes sends strings)
  if (node.format === 'left' || node.textAlign === 'left') return 'text-left';
  if (node.format === 'center' || node.textAlign === 'center') return 'text-center';
  if (node.format === 'right' || node.textAlign === 'right') return 'text-right';
  if (node.format === 'justify' || node.textAlign === 'justify') return 'text-justify';
  
  // Handle numeric alignment if present (less common in default adapter but good ensuring)
  // Usually format is formatting bits for TextNode, but can be alignment for ElementNode
  return '';
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

    // Upload/Image Nodes
    if (node.type === 'upload' && node.value?.url) {
      return (
        <div key={i} className={cn("my-4 relative", getAlignmentClass(node))}>
            <Image 
                src={node.value.url} 
                alt={node.value.alt || "Image"}
                width={node.value.width || 800} // Fallback width
                height={node.value.height || 600} // Fallback height
                className="rounded-lg max-w-full h-auto object-contain mx-auto"
                loading="lazy"
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
         // Check if paragraph has only zero-width space or empty, render break if needed
         if (node.children?.length === 0 || (node.children?.length === 1 && node.children[0].text === '')) {
             return <br key={i} />;
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
