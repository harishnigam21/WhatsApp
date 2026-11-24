import { Contact } from "@/redux/slices/ChatSlice";
import { useEffect, useMemo, useState } from "react";

export function useContactSearch(contacts: Contact[], delay = 400) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, delay);

    return () => clearTimeout(timer);
  }, [search, delay]);

  // Client-side filtering
  const filteredContacts = useMemo(() => {
    if (!debouncedSearch) return contacts;

    const query = debouncedSearch.toLowerCase();

    return contacts.filter((contact) => {
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.fullPhone?.includes(query)
      );
    });
  }, [contacts, debouncedSearch]);

  return {
    search,
    setSearch,
    filteredContacts,
  };
}
