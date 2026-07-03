from app.api.routes.quizzes import distribute_challenge_questions, normalize_concept_metadata


def test_zero_topics_returns_empty_list():
    assert distribute_challenge_questions(0, 10) == []


def test_single_topic_gets_all_questions():
    assert distribute_challenge_questions(1, 10) == [10]


def test_counts_always_sum_to_total():
    for num_topics in range(1, 8):
        for total in (5, 10, 12, 20):
            counts = distribute_challenge_questions(num_topics, total)
            assert sum(counts) == total


def test_every_topic_gets_at_least_one_question_when_total_comfortably_exceeds_topic_count():
    # With ample headroom (total >> num_topics), even the lowest-priority
    # topic should clear the rounding noise and get at least 1 question.
    counts = distribute_challenge_questions(4, 20)
    assert all(c >= 1 for c in counts)


def test_first_topic_gets_the_most_questions_weak_topic_priority():
    counts = distribute_challenge_questions(3, 12)
    assert counts[0] >= counts[1] >= counts[2]


def test_more_topics_than_questions_drops_lowest_priority_to_zero_but_never_negative():
    counts = distribute_challenge_questions(5, 3)
    assert len(counts) == 5
    assert sum(counts) == 3
    assert all(c >= 0 for c in counts)
    # highest-priority (weakest) topics are favored over the lowest
    assert counts[0] >= counts[-1]


def test_zero_total_returns_all_zero_counts():
    assert distribute_challenge_questions(4, 0) == [0, 0, 0, 0]


def test_normalize_keeps_well_formed_metadata():
    q = {
        "conceptIds": ["Recursion-Base-Case", "recursion"],
        "primaryConceptId": "recursion-base-case",
        "cognitiveLevel": "Apply",
    }
    normalize_concept_metadata(q)
    assert q["conceptIds"] == ["recursion-base-case", "recursion"]
    assert q["primaryConceptId"] == "recursion-base-case"
    assert q["cognitiveLevel"] == "apply"


def test_normalize_degrades_missing_metadata_to_legacy_shape():
    q = {"text": "What is recursion?"}
    normalize_concept_metadata(q)
    assert q["conceptIds"] == []
    assert q["primaryConceptId"] is None
    assert q["cognitiveLevel"] is None


def test_normalize_prepends_primary_when_absent_from_concept_ids():
    q = {"conceptIds": ["loops"], "primaryConceptId": "recursion", "cognitiveLevel": "understand"}
    normalize_concept_metadata(q)
    assert q["conceptIds"][0] == "recursion"
    assert q["primaryConceptId"] == "recursion"


def test_normalize_falls_back_to_first_concept_as_primary():
    q = {"conceptIds": ["recursion", "loops"]}
    normalize_concept_metadata(q)
    assert q["primaryConceptId"] == "recursion"


def test_normalize_rejects_invalid_cognitive_level_and_non_string_ids():
    q = {"conceptIds": ["ok", 42, "  ", None], "cognitiveLevel": "hallucinate"}
    normalize_concept_metadata(q)
    assert q["conceptIds"] == ["ok"]
    assert q["cognitiveLevel"] is None


def test_normalize_caps_concept_ids_at_three():
    q = {"conceptIds": ["a", "b", "c", "d", "e"]}
    normalize_concept_metadata(q)
    assert q["conceptIds"] == ["a", "b", "c"]
