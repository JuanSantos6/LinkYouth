-- ============================================================
-- Borra lo que deja la prueba de punta a punta de la Etapa 2
-- (`docs/prueba-etapa2.md`).
--
-- Solo toca lo marcado con «[E2E]» en el título: las búsquedas y eventos
-- que se crearon durante la prueba y los avisos que generaron. En cascada
-- caen sus tablas puente, las postulaciones a esas búsquedas y las
-- inscripciones a esos eventos.
--
-- Excepción consciente a la regla de CLAUDE.md «nunca se borran filas de
-- postulaciones ni eventos», igual que `borrar-vacantes-eventos-prueba.sql`:
-- la regla protege datos reales, y estas filas existen para ser borradas.
--
-- Primero corré solo el bloque «Qué se va a borrar» y mirá que la lista
-- sea la esperada. Después, todo el archivo.
-- ============================================================

-- Qué se va a borrar
select 'búsqueda' as que, id, titulo from vacantes where titulo like '[E2E]%'
union all
select 'evento', id, titulo from eventos where titulo like '[E2E]%'
union all
select 'aviso', id, mensaje from notificaciones where mensaje like '%«[E2E]%';

begin;

delete from notificaciones where mensaje like '%«[E2E]%';
delete from vacantes       where titulo  like '[E2E]%';
delete from eventos        where titulo  like '[E2E]%';

-- Las tres cuentas tienen que dar 0.
select
  (select count(*) from vacantes       where titulo  like '[E2E]%')  as busquedas,
  (select count(*) from eventos        where titulo  like '[E2E]%')  as eventos,
  (select count(*) from notificaciones where mensaje like '%«[E2E]%') as avisos;

commit;
