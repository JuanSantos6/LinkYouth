import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Encabezado } from "@/components/layout/Encabezado";
import { ImagenDeInstitucion } from "@/components/perfil/ImagenDeInstitucion";
import { Aviso, AvisoOrigen } from "@/components/ui/AvisoOrigen";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Foto } from "@/components/ui/Foto";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { obtenerInstitucion } from "@/lib/data/consultas";
import { imagenDeLugar } from "@/lib/data/fotos";
import { Institucion } from "@/lib/dominio/Institucion";

export const metadata: Metadata = { title: "Institución" };
export const dynamic = "force-dynamic";

/**
 * Ficha de una institución educativa.
 *
 * Es el destino del sub-bloque de `TarjetaUsuario`. Lo que muestra es lo único
 * que la base sabe hoy: cuántos perfiles la declaran y qué se cursa ahí. No
 * hay descripción, logo ni contacto porque no hay tabla de instituciones —el
 * nombre es texto libre dentro de `formaciones`— y esos campos no existen.
 *
 * La página lo dice en pantalla en lugar de rellenar con texto inventado: una
 * ficha institucional con datos de adorno es peor que una ficha corta.
 */
export default async function PaginaInstitucion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const institucion = await obtenerInstitucion(id);

  // Sin fila que mostrar es un 404 de verdad: el identificador sale del nombre,
  // así que uno que no corresponde a ninguna formación es una URL inventada o
  // una institución cuyo nombre alguien corrigió.
  if (!institucion.datos) notFound();

  const { nombre, estudiantes, titulos } = institucion.datos;
  // Una foto genérica de campus o aula, nunca el logo: la institución es real
  // y su marca no es nuestra. Sin foto, sus iniciales.
  const foto = await imagenDeLugar(
    `institucion:${new Institucion(nombre).id}`,
    null,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {foto ? (
        <div className="aspect-[21/9] w-full overflow-hidden rounded-tarjeta border border-borde">
          <Foto imagen={foto} sizes="(min-width: 768px) 768px, 100vw" />
        </div>
      ) : (
        <ImagenDeInstitucion nombre={nombre} tamanio={72} />
      )}
      <Encabezado
        titulo={nombre}
        descripcion="Institución educativa declarada por perfiles de LinkYouth."
      />

      <AvisoOrigen resultado={institucion} />

      <Tarjeta className="divide-y divide-filete">
        <div className="flex items-baseline justify-between p-5">
          <p className="text-[14px] text-apagado">
            {estudiantes === 1
              ? "perfil que estudia acá"
              : "perfiles que estudian acá"}
          </p>
          <p className="cifra text-[28px] text-tinta">{estudiantes}</p>
        </div>

        <div className="p-5">
          <h2 className="text-[14px] font-medium text-tinta">
            Qué se cursa acá
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {titulos.map((titulo) => (
              <li key={titulo}>
                <Etiqueta>{titulo}</Etiqueta>
              </li>
            ))}
          </ul>
        </div>
      </Tarjeta>

      <Aviso titulo="Esta ficha está incompleta">
        LinkYouth todavía no tiene un registro propio de instituciones: el
        nombre lo escribe cada persona al cargar su formación. Por eso acá no
        hay logo, descripción ni contacto, y dos formas de escribir el mismo
        nombre figuran como dos instituciones distintas.
      </Aviso>
    </div>
  );
}
