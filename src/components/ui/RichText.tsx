import { cn } from "@/lib/utils";
import React, { Fragment } from "react";

type Node = {
  type: string;
  value?: {
    url?: string;
    alt?: string;
  };
  children?: Node[];
  url?: string;
  [key: string]: unknown;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  format?: number; 
};

export const RichText = ({
  content,
  className,
}: {
  content: { root: Node } | any; // eslint-disable-line @typescript-eslint/no-explicit-any
  className?: string;
}) => {
  if (!content?.root?.children) return null;

  return (
    <div className={cn("prose dark:prose-invert max-w-none", className)}>
      {serialize(content.root.children)}
    </div>
  );
};

function serialize(children: Node[]): React.ReactNode {
  return children.map((node, i) => {
    if (React.isValidElement(node)) {
      return React.cloneElement(node, { key: i });
    }

    if (!node) {
      return null;
    }

    if (node.type === 'text') {
      let text = <span key={i} dangerouslySetInnerHTML={{ __html: escapeHTML(node.text || "") }} />;

      if (node.bold) {
        text = <strong key={i}>{text}</strong>;
      }

      if (node.code) {
        text = <code key={i}>{text}</code>;
      }

      if (node.italic) {
        text = <em key={i}>{text}</em>;
      }

      if (node.underline) {
        text = (
          <span style={{ textDecoration: 'underline' }} key={i}>
            {text}
          </span>
        );
      }

      if (node.strikethrough) {
        text = (
          <span style={{ textDecoration: 'line-through' }} key={i}>
            {text}
          </span>
        );
      }

      return <Fragment key={i}>{text}</Fragment>;
    }

    if (!node) {
      return null;
    }

    switch (node.type) {
      case 'h1':
        return <h1 key={i}>{serialize(node.children || [])}</h1>;
      case 'h2':
        return <h2 key={i}>{serialize(node.children || [])}</h2>;
      case 'h3':
        return <h3 key={i}>{serialize(node.children || [])}</h3>;
      case 'h4':
        return <h4 key={i}>{serialize(node.children || [])}</h4>;
      case 'h5':
        return <h5 key={i}>{serialize(node.children || [])}</h5>;
      case 'h6':
        return <h6 key={i}>{serialize(node.children || [])}</h6>;
      case 'quote':
        return <blockquote key={i}>{serialize(node.children || [])}</blockquote>;
      case 'ul':
        return <ul key={i}>{serialize(node.children || [])}</ul>;
      case 'ol':
        return <ol key={i}>{serialize(node.children || [])}</ol>;
      case 'li':
        return <li key={i}>{serialize(node.children || [])}</li>;
      case 'link':
        return (
          <a
            href={escapeHTML(node.url || "")}
            key={i}
            target={node.newTab ? '_blank' : undefined}
            rel={node.newTab ? 'noopener noreferrer' : undefined}
          >
            {serialize(node.children || [])}
          </a>
        );

      default:
        return <p key={i}>{serialize(node.children || [])}</p>;
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
