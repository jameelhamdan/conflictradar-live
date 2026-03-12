import ReactMarkdown from "react-markdown";


  const markdownComponents = {
    h2: ({ children }) => (
      <h2
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          color: "#c8c8d8",
          marginBottom: "0.9rem",
          letterSpacing: "-0.01em",
        }}
      >
        {children}
      </h2>
    ),
    p: ({ children }) => (
      <p
        style={{
          color: "#888899",
          lineHeight: 1.75,
          fontSize: "0.92rem",
          marginBottom: "0.75rem",
        }}
      >
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul
        style={{
          color: "#888899",
          lineHeight: 1.75,
          fontSize: "0.92rem",
          paddingLeft: "1.25rem",
          marginBottom: "0.75rem",
        }}
      >
        {children}
      </ul>
    ),
    a: ({ href, children }) => (
      <a href={href} style={{ color: "#7c9ef8" }}>
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong style={{ color: "#c8c8d8" }}>{children}</strong>
    ),
    span: ({ style, children }) => <span style={style}>{children}</span>,
  }

interface MarkdownProps {
  content: string
}

function Markdown({ content }: MarkdownProps) {
  return (
    <div className="article-body">
      <ReactMarkdown components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}


export default Markdown;