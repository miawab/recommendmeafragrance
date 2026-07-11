"""
Run: cd data-pipeline && python -m unittest test_build_catalog.py -v
"""
import unittest

from build_catalog import (
    deslug_title,
    normalize_accord,
    normalize_note,
    parse_notes_field,
)


class NormalizeNoteTests(unittest.TestCase):
    def test_strips_trailing_notes_suffix(self):
        self.assertEqual(normalize_note("green notes"), "green")
        self.assertEqual(normalize_note("woodsy notes"), "woody")

    def test_lowercases_and_slugifies(self):
        self.assertEqual(normalize_note("Bergamot"), "bergamot")
        self.assertEqual(normalize_note("Tonka Bean"), "tonka-bean")

    def test_strips_accents(self):
        self.assertEqual(normalize_note("Café"), "cafe")
        self.assertEqual(normalize_note("Amande"), "amande")

    def test_applies_known_synonyms(self):
        self.assertEqual(normalize_note("Vanille"), "vanilla")
        self.assertEqual(normalize_note("citruses"), "citrus")
        self.assertEqual(normalize_note("Aldehydes"), "aldehyde")

    def test_leaves_short_exception_words_singular_form_alone(self):
        self.assertEqual(normalize_note("Musk"), "musk")
        self.assertEqual(normalize_note("Iris"), "iris")

    def test_empty_and_whitespace_only_input(self):
        self.assertEqual(normalize_note("   "), "")

    def test_preserves_latin_us_singulars(self):
        # These are singular Latin-derived nouns, not simple plurals. A naive
        # trailing-"s" strip mangles them (e.g. "hibiscus" -> "hibiscu"), which
        # happened for real in the shipped notes.json until this was caught.
        self.assertEqual(normalize_note("Hibiscus"), "hibiscus")
        self.assertEqual(normalize_note("Lotus"), "lotus")
        self.assertEqual(normalize_note("Narcissus"), "narcissus")
        self.assertEqual(normalize_note("Eucalyptus"), "eucalyptus")
        self.assertEqual(normalize_note("Cactus"), "cactus")
        self.assertEqual(normalize_note("Papyrus"), "papyrus")
        self.assertEqual(normalize_note("Calamus"), "calamus")
        self.assertEqual(normalize_note("Gladiolus"), "gladiolus")
        self.assertEqual(normalize_note("Osmanthus"), "osmanthus")


class ParseNotesFieldTests(unittest.TestCase):
    def test_splits_and_normalizes_comma_list(self):
        self.assertEqual(
            parse_notes_field("Bergamot, Green Notes, Vanille"),
            ["bergamot", "green", "vanilla"],
        )

    def test_dedupes_within_a_single_field(self):
        self.assertEqual(parse_notes_field("Musk, Musk"), ["musk"])

    def test_handles_nan_like_missing_value(self):
        self.assertEqual(parse_notes_field(float("nan")), [])


class NormalizeAccordTests(unittest.TestCase):
    def test_slugifies_multi_word_accords(self):
        self.assertEqual(normalize_accord("Warm Spicy"), "warm-spicy")
        self.assertEqual(normalize_accord("White Floral"), "white-floral")


class DeslugTitleTests(unittest.TestCase):
    def test_title_cases_words(self):
        self.assertEqual(deslug_title("bleu-de-chanel"), "Bleu de Chanel")

    def test_keeps_small_words_lowercase_when_not_first(self):
        self.assertEqual(deslug_title("j-adore-in-joy"), "J Adore in Joy")

    def test_applies_brand_display_overrides(self):
        self.assertEqual(deslug_title("lattafa-perfumes"), "Lattafa")
        self.assertEqual(deslug_title("al-haramain-perfumes"), "Al Haramain")


if __name__ == "__main__":
    unittest.main()
