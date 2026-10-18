import pytest

from server.errors import BadRequestError
from server.models.split_models import SplitReceipt, SplitReceiptItem
from server.services.split_service import UNCLEAR_TAX_NOTE, allocate_cents, split_receipt


def make_item(item_id: str, total_price: float, tax_code: str | None = None) -> SplitReceiptItem:
    return SplitReceiptItem(id=item_id, name=item_id, total_price=total_price, tax_code=tax_code)


def make_receipt(items: list[SplitReceiptItem], tax: float | None, tip: float | None = None) -> SplitReceipt:
    return SplitReceipt(items=items, tax=tax, tip=tip)


def people_by_name(result):
    return {person.username: person for person in result.people}


def test_allocate_cents_always_adds_up():
    assert allocate_cents(1403, [1, 1]) == [702, 701]
    assert allocate_cents(100, [1, 1, 1]) == [34, 33, 33]
    assert allocate_cents(27, [1399, 379, 879]) == [14, 4, 9]
    assert sum(allocate_cents(1001, [3, 7, 11, 13])) == 1001


def test_costco_receipt_ice_cream_shared_by_two_roommates():
    receipt = make_receipt(
        [make_item("item_1", 13.99, "E"), make_item("item_2", 3.79, "E"), make_item("item_3", 8.79, "E")],
        tax=0.27,
    )
    result = split_receipt(
        receipt,
        {"item_1": ["alex", "sam"], "item_2": ["sachi"], "item_3": ["sachi"]},
        payer="sachi",
    )
    people = people_by_name(result)

    # Ice cream: 13.99 + its share of the 0.27 tax (0.14) = 14.13, split 7.07 / 7.06.
    assert people["alex"].total + people["sam"].total == pytest.approx(14.13)
    assert {people["alex"].owes, people["sam"].owes} == {7.07, 7.06}
    assert people["sachi"].owes == 0
    assert sum(person.total for person in result.people) == pytest.approx(26.84)
    assert result.total == pytest.approx(26.84)
    assert result.tax_note is None


def test_no_tax_means_no_tax_shares():
    receipt = make_receipt([make_item("item_1", 10.00), make_item("item_2", 5.00)], tax=None)
    result = split_receipt(receipt, {"item_1": ["alex"], "item_2": ["sachi"]}, payer="sachi")
    assert all(person.tax == 0 for person in result.people)
    assert people_by_name(result)["alex"].owes == 10.00


def test_mixed_codes_tax_only_the_group_that_fits():
    # 6% on the 20.00 of "A" items = 1.20; the "N" items were untaxed.
    receipt = make_receipt(
        [make_item("item_1", 20.00, "A"), make_item("item_2", 3.33, "N"), make_item("item_3", 4.44, "N")],
        tax=1.20,
    )
    result = split_receipt(
        receipt, {"item_1": ["alex"], "item_2": ["sachi"], "item_3": ["sam"]}, payer="sachi"
    )
    people = people_by_name(result)
    assert people["alex"].tax == 1.20
    assert people["sachi"].tax == 0
    assert people["sam"].tax == 0
    assert result.tax_note is None


def test_ambiguous_tax_spreads_across_everything_with_a_note():
    receipt = make_receipt([make_item("item_1", 1.00, "A"), make_item("item_2", 1.00, "B")], tax=0.05)
    result = split_receipt(receipt, {"item_1": ["alex"], "item_2": ["sam"]}, payer="sachi")
    assert result.tax_note == UNCLEAR_TAX_NOTE
    assert sum(person.tax for person in result.people) == pytest.approx(0.05)


def test_tip_is_split_by_price():
    receipt = make_receipt([make_item("item_1", 30.00), make_item("item_2", 10.00)], tax=None, tip=4.00)
    result = split_receipt(receipt, {"item_1": ["alex"], "item_2": ["sam"]}, payer="sachi")
    people = people_by_name(result)
    assert people["alex"].tip == 3.00
    assert people["sam"].tip == 1.00


def test_usernames_are_normalized_and_deduplicated():
    receipt = make_receipt([make_item("item_1", 9.00)], tax=None)
    result = split_receipt(receipt, {"item_1": ["Alex", "alex ", "sam"]}, payer="sachi")
    assert sorted(person.username for person in result.people) == ["alex", "sam"]
    assert people_by_name(result)["alex"].owes == 4.50


def test_unassigned_item_is_rejected():
    receipt = make_receipt([make_item("item_1", 5.00), make_item("item_2", 5.00)], tax=None)
    with pytest.raises(BadRequestError, match="item_2"):
        split_receipt(receipt, {"item_1": ["alex"]}, payer="sachi")


def test_unknown_item_is_rejected():
    receipt = make_receipt([make_item("item_1", 5.00)], tax=None)
    with pytest.raises(BadRequestError, match="item_9"):
        split_receipt(receipt, {"item_1": ["alex"], "item_9": ["sam"]}, payer="sachi")
