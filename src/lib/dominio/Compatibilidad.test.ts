import { describe, expect, it } from "vitest";
import { Compatibilidad } from "./Compatibilidad";

describe("Compatibilidad (RF3.5.2)", () => {
  it("usa un perfil vacío por defecto cuando se omite en entre()", () => {
    const vacante = {
      habilidades: ["Excel", "Comunicación"],
      tags: ["Administración"],
    };

    const compatibilidad = Compatibilidad.entre(vacante);

    expect(compatibilidad.medible).toBe(true);
    expect(compatibilidad.porcentaje).toBe(0);
    expect(compatibilidad.alta).toBe(false);
    expect(compatibilidad.cantidadCubierta).toBe(0);
    expect(compatibilidad.cantidadRequerida).toBe(3);
    expect(compatibilidad.faltantes).toEqual([
      "Excel",
      "Comunicación",
      "Administración",
    ]);
    expect(compatibilidad.cubre("Excel")).toBe(false);
  });

  it("no es medible ni tiene compatibilidad alta si la vacante no pide tags ni habilidades", () => {
    const vacanteVacia = { habilidades: [], tags: [] };
    const perfil = {
      habilidades: ["Excel", "Python"],
      tags: ["Tecnología"],
    };

    const compatibilidad = Compatibilidad.entre(vacanteVacia, perfil);

    expect(compatibilidad.medible).toBe(false);
    expect(compatibilidad.porcentaje).toBe(0);
    expect(compatibilidad.alta).toBe(false);
    expect(compatibilidad.cantidadCubierta).toBe(0);
    expect(compatibilidad.cantidadRequerida).toBe(0);
    expect(compatibilidad.faltantes).toEqual([]);
  });

  it("redondea el porcentaje al entero más cercano", () => {
    const vacante = {
      habilidades: ["Excel", "Inglés"],
      tags: ["Atención al cliente"],
    };

    const unaDeTres = Compatibilidad.entre(vacante, {
      habilidades: ["Excel"],
      tags: [],
    });
    expect(unaDeTres.porcentaje).toBe(33);

    const dosDeTres = Compatibilidad.entre(vacante, {
      habilidades: ["Excel", "Inglés"],
      tags: [],
    });
    expect(dosDeTres.porcentaje).toBe(67);

    const tresDeTres = Compatibilidad.entre(vacante, {
      habilidades: ["Excel", "Inglés"],
      tags: ["Atención al cliente"],
    });
    expect(tresDeTres.porcentaje).toBe(100);
  });

  it("considera alta la compatibilidad desde el umbral de 70 % inclusive", () => {
    const diezRequisitos = {
      habilidades: ["H1", "H2", "H3", "H4", "H5"],
      tags: ["T1", "T2", "T3", "T4", "T5"],
    };

    const enElUmbral = Compatibilidad.entre(diezRequisitos, {
      habilidades: ["H1", "H2", "H3", "H4", "H5"],
      tags: ["T1", "T2"],
    });
    expect(enElUmbral.porcentaje).toBe(70);
    expect(enElUmbral.alta).toBe(true);

    const debajoDelUmbral = Compatibilidad.entre(diezRequisitos, {
      habilidades: ["H1", "H2", "H3", "H4", "H5"],
      tags: ["T1"],
    });
    expect(debajoDelUmbral.porcentaje).toBe(60);
    expect(debajoDelUmbral.alta).toBe(false);

    const dosDeTres = Compatibilidad.entre(
      { habilidades: ["A", "B"], tags: ["C"] },
      { habilidades: ["A", "B"], tags: [] },
    );
    expect(dosDeTres.porcentaje).toBe(67);
    expect(dosDeTres.alta).toBe(false);
  });

  it("ignora mayúsculas, minúsculas y espacios alrededor en el perfil, la vacante y cubre()", () => {
    const vacante = {
      habilidades: ["  Trabajo en Equipo ", "EXCEL"],
      tags: [" Atención al Público "],
    };
    const perfil = {
      habilidades: ["trabajo en equipo", "  excel  "],
      tags: [],
    };

    const compatibilidad = Compatibilidad.entre(vacante, perfil);

    expect(compatibilidad.cubre("trabajo en equipo")).toBe(true);
    expect(compatibilidad.cubre("  TRABAJO EN EQUIPO  ")).toBe(true);
    expect(compatibilidad.cubre("   excel")).toBe(true);
    expect(compatibilidad.cubre("atención al público")).toBe(false);
    expect(compatibilidad.cantidadCubierta).toBe(2);
    expect(compatibilidad.faltantes).toEqual([" Atención al Público "]);
  });

  it("permite que un tag del perfil cubra una habilidad de la vacante y viceversa", () => {
    const vacante = {
      habilidades: ["Diseño gráfico"],
      tags: ["Comunicación"],
    };
    const perfil = {
      habilidades: ["Comunicación"],
      tags: ["Diseño gráfico"],
    };

    const compatibilidad = Compatibilidad.entre(vacante, perfil);

    expect(compatibilidad.porcentaje).toBe(100);
    expect(compatibilidad.alta).toBe(true);
    expect(compatibilidad.cubre("Diseño gráfico")).toBe(true);
    expect(compatibilidad.cubre("Comunicación")).toBe(true);
    expect(compatibilidad.cantidadCubierta).toBe(2);
    expect(compatibilidad.faltantes).toEqual([]);
  });

  it("calcula cantidadCubierta, cantidadRequerida y faltantes respetando el orden de la vacante", () => {
    const vacante = {
      habilidades: ["HTML", "CSS", "JavaScript"],
      tags: ["Frontend", "Accesibilidad"],
    };
    const perfil = {
      habilidades: ["CSS"],
      tags: ["Accesibilidad"],
    };

    const compatibilidad = Compatibilidad.entre(vacante, perfil);

    expect(compatibilidad.cantidadRequerida).toBe(5);
    expect(compatibilidad.cantidadCubierta).toBe(2);
    // La clase concatena primero las habilidades y después los tags de la vacante.
    expect(compatibilidad.faltantes).toEqual([
      "HTML",
      "JavaScript",
      "Frontend",
    ]);
  });

  it("documenta la diferencia entre porcentaje y cantidadCubierta cuando hay requisitos repetidos en la vacante", () => {
    // Si un mismo requisito aparece tanto en habilidades como en tags (o repetido),
    // `requisitos` conserva los duplicados (largo 2), mientras que `cubiertos` es un
    // Set sin duplicados (tamaño 1). Por eso `cantidadCubierta` filtra el arreglo y
    // cuenta las 2 apariciones, pero `porcentaje` divide `cubiertos.size` (1) por
    // `requisitos.length` (2) y da 50 % en vez de 100 %.
    const vacanteConRepetidos = {
      habilidades: ["Inglés"],
      tags: ["inglés"],
    };
    const perfil = {
      habilidades: ["Inglés"],
      tags: [],
    };

    const compatibilidad = Compatibilidad.entre(vacanteConRepetidos, perfil);

    expect(compatibilidad.cantidadRequerida).toBe(2);
    expect(compatibilidad.cantidadCubierta).toBe(2);
    expect(compatibilidad.porcentaje).toBe(50);
    expect(compatibilidad.faltantes).toEqual([]);
  });
});
