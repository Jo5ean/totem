-- Script para crear las aulas UAM en la base de datos TOTEM
-- Ejecutar en DBeaver con la base de datos totem_db seleccionada

USE totem_db;

-- Insertar las aulas UAM según especificación
INSERT INTO aulas (nombre, capacidad, ubicacion, disponible, created_at, updated_at) 
VALUES 
  ('Aula 4', 72, 'Edificio Principal UAM 03', 1, NOW(), NOW()),
  ('Aula 8', 71, 'Edificio Principal UAM 03', 1, NOW(), NOW()),
  ('Aula 12', 69, 'Edificio Principal UAM 03', 1, NOW(), NOW()),
  ('Laboratorio Informático', 34, 'Laboratorio UAM 03', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  capacidad = VALUES(capacidad),
  ubicacion = VALUES(ubicacion),
  disponible = VALUES(disponible),
  updated_at = NOW();

-- Verificar que las aulas se crearon correctamente
SELECT 
  id,
  nombre,
  capacidad,
  ubicacion,
  CASE WHEN disponible = 1 THEN 'Disponible' ELSE 'No disponible' END as estado,
  created_at
FROM aulas 
ORDER BY capacidad DESC;

-- Mostrar resumen
SELECT 
  COUNT(*) as total_aulas,
  SUM(capacidad) as capacidad_total,
  SUM(CASE WHEN disponible = 1 THEN 1 ELSE 0 END) as aulas_disponibles
FROM aulas; 