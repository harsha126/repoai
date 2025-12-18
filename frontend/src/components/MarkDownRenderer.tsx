import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type Props = {
    answer: string;
};

export default function MarkdownRenderer({ answer }: Props) {
    return (
        <ReactMarkdown
            components={{
                code({ inline, className, children }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
                    const match = /language-(\w+)/.exec(className || "");

                    // BLOCK CODE
                    if (!inline && match) {
                        return (
                            <SyntaxHighlighter
                                language={match[1]}
                                style={vscDarkPlus as any}
                                PreTag="div"
                                customStyle={{
                                    background: "#1e1e1e", // VS Code editor bg
                                    borderRadius: "10px",
                                    padding: "16px",
                                    margin: "12px 0",
                                    fontSize: "13.5px",
                                }}
                            >
                                {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                        );
                    }

                    // INLINE CODE
                    return (
                        <code
                            style={{
                                background: "#2d2d2d",
                                padding: "2px 6px",
                                borderRadius: "6px",
                                fontSize: "13px",
                            }}
                        >
                            {children}
                        </code>
                    );
                },

                // Headings
                h3({ children }) {
                    return (
                        <h3 style={{ marginTop: "18px", fontWeight: 600 }}>
                            {children}
                        </h3>
                    );
                },

                // Lists
                li({ children }) {
                    return (
                        <li style={{ marginBottom: "6px", lineHeight: "1.6" }}>
                            {children}
                        </li>
                    );
                },
            }}
        >
            {answer}
        </ReactMarkdown>
    );
}
