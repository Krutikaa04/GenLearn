from app.services.chunker import chunk_text


def test_empty_text_produces_no_chunks():
    assert chunk_text("") == []


def test_short_text_produces_a_single_chunk():
    chunks = chunk_text("hello world", chunk_size=500, overlap=50)
    assert len(chunks) == 1
    assert chunks[0].content == "hello world"
    assert chunks[0].chunk_index == 0


def test_long_text_splits_into_multiple_chunks_with_overlap():
    words = [f"word{i}" for i in range(120)]
    text = " ".join(words)

    chunks = chunk_text(text, chunk_size=50, overlap=10)

    assert len(chunks) > 1
    # consecutive chunks share the overlap region
    first_chunk_words = chunks[0].content.split()
    second_chunk_words = chunks[1].content.split()
    assert first_chunk_words[-10:] == second_chunk_words[:10]


def test_chunk_indices_are_sequential():
    text = " ".join(f"word{i}" for i in range(300))

    chunks = chunk_text(text, chunk_size=50, overlap=10)

    assert [c.chunk_index for c in chunks] == list(range(len(chunks)))


def test_token_count_is_roughly_one_quarter_of_char_count():
    chunks = chunk_text("a b c d e f g h", chunk_size=500, overlap=0)
    assert chunks[0].token_count == len(chunks[0].content) // 4
