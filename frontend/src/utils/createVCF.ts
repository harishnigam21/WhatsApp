type Contact = {
  name: string;
  tel: string;
  email: string;
};

// Escape special characters in vCard values
function escapeVCard(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function createVCF(contacts: Contact[]) {
  const vcfContent = contacts
    .map((contact) => {
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${escapeVCard(contact.name)}`,
        `TEL;TYPE=CELL:${escapeVCard(contact.tel)}`,
        `EMAIL:${escapeVCard(contact.email)}`,
        "END:VCARD",
      ].join("\r\n");
    })
    .join("\r\n");

  return new Blob([vcfContent + "\r\n"], {
    type: "text/vcard;charset=utf-8",
  });
}
