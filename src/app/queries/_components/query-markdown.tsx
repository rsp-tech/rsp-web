"use client";

import Markdown from "markdown-to-jsx";
import Link from "next/link";
import React from "react";

interface QueryMarkdownProps {
  content: string;
  className?: string;
}

const MarkdownLink = ({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  if (!href) return <span {...props}>{children}</span>;

  const isInternal = href.startsWith("/") || href.startsWith("#");

  if (isInternal) {
    return (
      <Link
        href={href}
        className="text-primary font-medium cursor-pointer"
        style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary font-medium cursor-pointer"
      style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}
      {...props}
    >
      {children}
    </a>
  );
};

export const QueryMarkdown = ({
  content,
  className = "",
}: QueryMarkdownProps) => {
  if (!content) return null;

  return (
    <div className={className}>
      <Markdown
        options={{
          wrapper: React.Fragment,
          overrides: {
            a: { component: MarkdownLink },
            h1: {
              component: "h3",
              props: {
                className: "font-bold text-sm text-foreground",
                style: { marginTop: "0.5rem", marginBottom: "0.25rem" },
              },
            },
            h2: {
              component: "h4",
              props: {
                className: "font-bold text-xs text-foreground",
                style: { marginTop: "0.5rem", marginBottom: "0.25rem" },
              },
            },
            h3: {
              component: "h5",
              props: {
                className:
                  "font-medium text-xs text-foreground uppercase tracking-wider",
                style: { marginTop: "0.375rem", marginBottom: "0.25rem" },
              },
            },
            h4: {
              component: "h6",
              props: {
                className: "font-medium text-xs text-foreground",
                style: { marginTop: "0.25rem", marginBottom: "0.125rem" },
              },
            },
            p: {
              component: "p",
              props: {
                className: "text-xs text-foreground leading-relaxed",
                style: {
                  marginTop: "0.25rem",
                  marginBottom: "0.25rem",
                  whiteSpace: "pre-wrap",
                },
              },
            },
            ul: {
              component: "ul",
              props: {
                className: "pl-6 text-xs text-foreground",
                style: {
                  listStyleType: "disc",
                  marginTop: "0.25rem",
                  marginBottom: "0.25rem",
                },
              },
            },
            ol: {
              component: "ol",
              props: {
                className: "pl-6 text-xs text-foreground",
                style: {
                  listStyleType: "decimal",
                  marginTop: "0.25rem",
                  marginBottom: "0.25rem",
                },
              },
            },
            li: {
              component: "li",
              props: {
                className: "text-xs text-foreground leading-relaxed",
                style: { marginTop: "0.125rem", marginBottom: "0.125rem" },
              },
            },
            blockquote: {
              component: "blockquote",
              props: {
                className: "pl-6 text-xs text-muted-foreground",
                style: {
                  borderLeft: "2px solid var(--primary)",
                  fontStyle: "italic",
                  marginTop: "0.375rem",
                  marginBottom: "0.375rem",
                },
              },
            },
            code: {
              component: "code",
              props: {
                className: "bg-muted px-1 py-0.5 rounded-md text-xxs",
              },
            },
            pre: {
              component: "pre",
              props: {
                className: "bg-muted p-2 rounded-md text-xxs",
                style: {
                  marginTop: "0.375rem",
                  marginBottom: "0.375rem",
                  overflowX: "auto",
                },
              },
            },
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
