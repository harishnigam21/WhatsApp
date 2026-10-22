"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import ReactCountryFlag from "react-country-flag";
interface countryDataType {
  name: string;
  dial_code: string;
  code: string;
}
const countryData: countryDataType[] = [
  { name: "Afghanistan", dial_code: "+93", code: "AF" },
  { name: "Albania", dial_code: "+355", code: "AL" },
  { name: "Algeria", dial_code: "+213", code: "DZ" },
  { name: "Argentina", dial_code: "+54", code: "AR" },
  { name: "Australia", dial_code: "+61", code: "AU" },
  { name: "Brazil", dial_code: "+55", code: "BR" },
  { name: "Canada", dial_code: "+1", code: "CA" },
  { name: "China", dial_code: "+86", code: "CN" },
  { name: "Egypt", dial_code: "+20", code: "EG" },
  { name: "France", dial_code: "+33", code: "FR" },
  { name: "Germany", dial_code: "+49", code: "DE" },
  { name: "India", dial_code: "+91", code: "IN" },
  { name: "Indonesia", dial_code: "+62", code: "ID" },
  { name: "Mexico", dial_code: "+52", code: "MX" },
  { name: "Pakistan", dial_code: "+92", code: "PK" },
  { name: "United Kingdom", dial_code: "+44", code: "GB" },
  { name: "United States", dial_code: "+1", code: "US" },
];

export default function CountryPicker({
  mobileNumber,
  setMobileNumber,
  setCountryCode,
  handlSendOTP,
}: {
  mobileNumber: string | null;
  setMobileNumber: React.Dispatch<React.SetStateAction<string | null>>;
  setCountryCode: React.Dispatch<React.SetStateAction<string | null>>;
  handlSendOTP: () => void;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<countryDataType>(
    countryData.find((c) => c.code === "IN") || countryData[0],
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handleCountryChange = (code: string) => {
    setSelectedCountry(
      () => countryData?.find((c) => c.code === code) || countryData[0],
    );
  };
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return countryData;

    return countryData.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.dial_code.includes(query) ||
        country.code.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const handleSelect = (country: (typeof countryData)[0]) => {
    setSelectedCountry(country);
    handleCountryChange(country.code);
    setIsOpen(false);
    setSearchQuery("");
  };
  useEffect(() => {
    setCountryCode(selectedCountry.dial_code);
  }, [selectedCountry]);
  return (
    <div className="relative w-full max-w-sm" ref={dropdownRef}>
      <div className="flex flex-col gap-2 rounded-md shadow-sm overflow-hidden">
        {/* Country Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full justify-between items-center gap-2 py-3 px-3 rounded-full h-12 cursor-pointer border border-borderhl"
        >
          <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
            <ReactCountryFlag
              countryCode={selectedCountry.code}
              svg
              style={{ width: "1em", height: "1em" }}
            />
            <span className="text-sm font-medium -mt-1">
              {selectedCountry.name}
            </span>
          </div>
          <ChevronDownIcon size={14} strokeWidth={3} className="mt-1" />
        </button>
        <div>
          {isOpen && (
            <div className="absolute z-10 mt-0.5 w-3/4 bg-bgsec border border-borderhl rounded-xl overflow-hidden max-h-64 flex flex-col">
              {/* Sticky Search Input */}
              <div className="px-2 mb-2 mt-3 sticky top-0">
                <input
                  type="text"
                  placeholder="Search country or dial code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 px-4 text-sm border border-borderhl focus:border-pri outline-none focus:outline-none rounded-full"
                />
              </div>

              {/* Country Items Scroll Area */}
              <ul className="overflow-y-auto scrollbar-thin scrollbar-thumb-borderhl">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <li key={country.code} className="p-1">
                      <button
                        type="button"
                        onClick={() => handleSelect(country)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-borderhl rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <ReactCountryFlag
                            countryCode={country.code}
                            svg
                            style={{ width: "1em", height: "1em" }}
                          />
                          <span className="text-sm font-medium opacity-40">
                            {country.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 font-mono">
                          {country.dial_code}
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-4 text-sm text-gray-500 text-center">
                    No countries found
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        {/* Real Phone Input Field */}
        <div className="w-full border border-borderhl rounded-full flex items-center h-12 flex-nowrap gap-1 overflow-hidden">
          <p className="py-3 pl-3">{selectedCountry.dial_code}</p>
          <input
            type="tel"
            id="phone_number"
            placeholder="00000 00000"
            className="w-full pr-3 py-3 outline-none"
            value={mobileNumber || ""}
            onChange={(e) => {
              const cleanNumbersOnly = e.target.value.replace(/\D/g, "");
              setMobileNumber(cleanNumbersOnly);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key == "Enter") {
                handlSendOTP();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
