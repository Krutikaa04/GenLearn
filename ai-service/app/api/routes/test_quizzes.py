from app.api.routes.quizzes import distribute_challenge_questions


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
