export function clientWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  let e164 = digits;
  if (digits.startsWith("0") && digits.length >= 8) {
    e164 = `598${digits.slice(1)}`;
  } else if (!digits.startsWith("598") && digits.length <= 9) {
    e164 = `598${digits}`;
  }
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

export function clientAcceptedMessage(params: {
  name: string;
  siteUrl: string;
  email: string;
  password: string;
}) {
  return [
    `Hola ${params.name},`,
    "",
    "Fuiste aceptado como cliente de nuestra web.",
    "",
    `Ingresá en: ${params.siteUrl}`,
    `Usuario (email): ${params.email}`,
    `Contraseña: ${params.password}`,
    "",
    "Con esas credenciales vas a poder ver precios mayoristas y girar la ruleta de descuentos.",
    "",
    "— Beautymax Distribuidora",
  ].join("\n");
}
