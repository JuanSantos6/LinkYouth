-- ============================================================
-- Borra la carga de `db/seed-vacantes-eventos-prueba.sql`.
--
-- Solo toca filas cuyo id empieza con `5eed`, que es la marca de esa carga.
-- En cascada caen sus tags, habilidades, tags ocultos, y las postulaciones e
-- inscripciones que se hayan hecho sobre ellas durante las pruebas.
--
-- Excepción consciente a la regla de CLAUDE.md «nunca se borran filas de
-- postulaciones ni eventos»: esa regla protege datos reales. Estas filas son
-- de prueba y existen para ser borradas.
-- ============================================================

delete from vacantes where id::text like '5eed%';
delete from eventos  where id::text like '5eed%';

select
  (select count(*) from vacantes where id::text like '5eed%') as vacantes_que_quedan, -- 0
  (select count(*) from eventos  where id::text like '5eed%') as eventos_que_quedan;  -- 0
