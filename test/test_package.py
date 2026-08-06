import pytest

import hrpc_test


@pytest.mark.parametrize("family", hrpc_test.FAMILIES)
def test_family_loads(family):
    loaded = hrpc_test.load_family(family)
    assert loaded["frames"], f"{family}: no frames"
    assert len(loaded["frames"]) == len(loaded["messages"]), "one frame per message"


def test_negative_loads():
    assert hrpc_test.load_negative()


def test_sequence_loads():
    assert hrpc_test.load_sequence()["count"]
