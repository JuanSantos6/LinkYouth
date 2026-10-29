import { crc32, deflateSync } from "node:zlib";

/** Un PNG sin comprimir de unos `bytes` bytes: ancho 1000, RGB. */
export function png(bytes: number): Buffer {
  const ancho = 1000;
  const alto = Math.max(1, Math.round(bytes / (ancho * 3)));
  const crudo = Buffer.alloc((ancho * 3 + 1) * alto, 0x7f);
  for (let y = 0; y < alto; y++) crudo[y * (ancho * 3 + 1)] = 0;

  const trozo = (tipo: string, datos: Buffer) => {
    const largo = Buffer.alloc(4);
    largo.writeUInt32BE(datos.length);
    const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
    const suma = Buffer.alloc(4);
    suma.writeUInt32BE(crc32(cuerpo));
    return Buffer.concat([largo, cuerpo, suma]);
  };
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(ancho, 0);
  cabecera.writeUInt32BE(alto, 4);
  cabecera[8] = 8; // profundidad
  cabecera[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo("IHDR", cabecera),
    trozo("IDAT", deflateSync(crudo, { level: 0 })),
    trozo("IEND", Buffer.alloc(0)),
  ]);
}
