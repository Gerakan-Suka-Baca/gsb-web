import escapeHTML from 'escape-html';
import { Text } from 'slate';

interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

type RichTextNode = {
  type?: string;
  children?: RichTextNode[];
  url?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

export const serializeRichText = (children: RichTextNode[]): React.ReactNode[] =>
  children.map((node, i) => {
    if (Text.isText(node)) {
      const customNode = node as CustomText;
      let text = <span dangerouslySetInnerHTML={{ __html: escapeHTML(customNode.text) }} />;

      if (customNode.bold) {
        text = <strong key={i}>{text}</strong>;
      }

      if (customNode.code) {
        text = <code key={i}>{text}</code>;
      }

      if (customNode.italic) {
        text = <em key={i}>{text}</em>;
      }

      if (customNode.underline) {
        text = <u key={i}>{text}</u>;
      }

      if (customNode.strikethrough) {
        text = <s key={i}>{text}</s>;
      }

      return <span key={i}>{text}</span>;
    }

    if (!node) {
      return null;
    }

    const childNodes = Array.isArray(node.children) ? node.children : [];
    switch (node.type) {
      case 'h1':
        return <h1 key={i}>{serializeRichText(childNodes)}</h1>;
      case 'h2':
        return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{serializeRichText(childNodes)}</h2>;
      case 'h3':
        return <h3 key={i} className="text-lg font-bold mt-3 mb-1">{serializeRichText(childNodes)}</h3>;
      case 'h4':
        return <h4 key={i}>{serializeRichText(childNodes)}</h4>;
      case 'h5':
        return <h5 key={i}>{serializeRichText(childNodes)}</h5>;
      case 'h6':
        return <h6 key={i}>{serializeRichText(childNodes)}</h6>;
      case 'quote':
        return <blockquote key={i}>{serializeRichText(childNodes)}</blockquote>;
      case 'ul':
        return <ul key={i} className="list-disc pl-5 mb-4">{serializeRichText(childNodes)}</ul>;
      case 'ol':
        return <ol key={i} className="list-decimal pl-5 mb-4">{serializeRichText(childNodes)}</ol>;
      case 'li':
        return <li key={i}>{serializeRichText(childNodes)}</li>;
      case 'link':
        return (
          <a href={escapeHTML(node.url ?? "")} key={i} className="text-blue-600 hover:underline">
            {serializeRichText(childNodes)}
          </a>
        );
      default:
        return <p key={i} className="mb-4 leading-relaxed">{serializeRichText(childNodes)}</p>;
    }
  });
