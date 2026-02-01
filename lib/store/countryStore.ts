"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CountryState = {
  // Selected country workspace (used for ALL dashboard API calls)
  countryCode: string;

  // Optional language (future-ready)
  languageCode: string;

  // Setters
  setCountryCode: (code: string) => void;
  setLanguageCode: (code: string) => void;

  // Helpers
  reset: () => void;
};

const DEFAULT_COUNTRY = "ZA";
const DEFAULT_LANGUAGE = "en";

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      countryCode: DEFAULT_COUNTRY,
      languageCode: DEFAULT_LANGUAGE,

      setCountryCode: (code: string) =>
        set({
          countryCode: (code || DEFAULT_COUNTRY).toUpperCase(),
        }),

      setLanguageCode: (code: string) =>
        set({
          languageCode: (code || DEFAULT_LANGUAGE).toLowerCase(),
        }),

      reset: () =>
        set({
          countryCode: DEFAULT_COUNTRY,
          languageCode: DEFAULT_LANGUAGE,
        }),
    }),
    {
      name: "towmech_country_store",
      version: 1,
    }
  )
);