"""Split text into overlapping chunks suitable for embedding."""
from dataclasses import dataclass


@dataclass
class Chunk:
    content: str
    chunk_index: int
    token_count: int  # rough estimate: 1 token ≈ 4 chars


def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50,
) -> list[Chunk]:
    """Split text into word-boundary chunks of ~chunk_size tokens with overlap."""
    words = text.split()
    chunks: list[Chunk] = []
    start = 0
    index = 0

    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        content = " ".join(chunk_words)
        chunks.append(Chunk(
            content=content,
            chunk_index=index,
            token_count=len(content) // 4,
        ))
        start += chunk_size - overlap
        index += 1

    return chunks
