-- 🚀 SCRIPT DE CREACIÓN DE BASE DE DATOS - TOTEM UCASAL
-- Para MySQL en data center UCASAL
-- Fecha: 30 Junio 2025

-- ========================================
-- 1. CREAR BASE DE DATOS (si no existe)
-- ========================================
CREATE DATABASE IF NOT EXISTS totem_ucasal 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE totem_ucasal;

-- ========================================
-- 2. FACULTADES
-- ========================================
CREATE TABLE facultades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- 3. CARRERAS
-- ========================================
CREATE TABLE carreras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    facultadId INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (facultadId) REFERENCES facultades(id) ON DELETE CASCADE,
    INDEX idx_facultad (facultadId),
    INDEX idx_codigo (codigo)
);

-- ========================================
-- 4. AULAS
-- ========================================
CREATE TABLE aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    capacidad INT NOT NULL DEFAULT 50,
    tipoAula ENUM('regular', 'laboratorio', 'auditorio') DEFAULT 'regular',
    ubicacion VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_capacidad (capacidad)
);

-- ========================================
-- 5. EXÁMENES
-- ========================================
CREATE TABLE examenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carreraId INT NOT NULL,
    aulaId INT NULL,
    nombreMateria VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NULL,
    tipoExamen VARCHAR(100),
    modalidadExamen ENUM('presencial', 'virtual') DEFAULT 'presencial',
    monitoreo TEXT,
    materialPermitido TEXT,
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    asignacionAuto BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (carreraId) REFERENCES carreras(id) ON DELETE CASCADE,
    FOREIGN KEY (aulaId) REFERENCES aulas(id) ON DELETE SET NULL,
    INDEX idx_fecha (fecha),
    INDEX idx_carrera (carreraId),
    INDEX idx_aula (aulaId),
    INDEX idx_activo (activo)
);

-- ========================================
-- 6. MAPEO SECTORES → FACULTADES
-- ========================================
CREATE TABLE sector_facultad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sector VARCHAR(255) NOT NULL,
    facultadId INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (facultadId) REFERENCES facultades(id) ON DELETE CASCADE,
    UNIQUE KEY unique_sector (sector),
    INDEX idx_sector (sector)
);

-- ========================================
-- 7. MAPEO CARRERAS TOTEM → CARRERAS
-- ========================================
CREATE TABLE carrera_totem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigoTotem VARCHAR(50) NOT NULL UNIQUE,
    nombreTotem VARCHAR(255),
    carreraId INT NULL,
    esMapeada BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (carreraId) REFERENCES carreras(id) ON DELETE SET NULL,
    INDEX idx_codigo_totem (codigoTotem),
    INDEX idx_mapeada (esMapeada)
);

-- ========================================
-- 8. DATOS ORIGINALES TOTEM
-- ========================================
CREATE TABLE examen_totem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    examenId INT NOT NULL,
    sectorTotem VARCHAR(255),
    carreraTotem VARCHAR(255),
    materiaTotem VARCHAR(255),
    areaTemaTotem VARCHAR(255),
    modoTotem VARCHAR(255),
    urlTotem TEXT,
    catedraTotem VARCHAR(255),
    docenteTotem VARCHAR(255),
    monitoreoTotem TEXT,
    controlTotem VARCHAR(255),
    dataOriginal JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (examenId) REFERENCES examenes(id) ON DELETE CASCADE,
    INDEX idx_examen (examenId),
    INDEX idx_sector_totem (sectorTotem),
    INDEX idx_carrera_totem (carreraTotem)
);

-- ========================================
-- 9. INSCRIPCIONES DE ESTUDIANTES
-- ========================================
CREATE TABLE inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    examenId INT NOT NULL,
    dni VARCHAR(20) NOT NULL,
    nombreCompleto VARCHAR(255),
    email VARCHAR(255),
    sede VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (examenId) REFERENCES examenes(id) ON DELETE CASCADE,
    INDEX idx_examen (examenId),
    INDEX idx_dni (dni),
    INDEX idx_sede (sede),
    UNIQUE KEY unique_inscripcion (examenId, dni)
);

-- ========================================
-- 10. DATOS BRUTOS TOTEM (SHEET.BEST)
-- ========================================
CREATE TABLE totem_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sheetName VARCHAR(255) NOT NULL,
    data JSON NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_processed (processed),
    INDEX idx_sheet_name (sheetName)
);

-- ========================================
-- 11. LOGS DE SINCRONIZACIÓN
-- ========================================
CREATE TABLE sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('TOTEM', 'INSCRIPCIONES', 'MANUAL') NOT NULL,
    estado ENUM('INICIADO', 'COMPLETADO', 'ERROR') NOT NULL,
    mensaje TEXT,
    datosAdicionales JSON,
    facultadId INT NULL,
    registrosProcesados INT DEFAULT 0,
    registrosCreados INT DEFAULT 0,
    registrosActualizados INT DEFAULT 0,
    duracion INT, -- en millisegundos
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (facultadId) REFERENCES facultades(id) ON DELETE SET NULL,
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    INDEX idx_fecha (createdAt)
);

-- ========================================
-- 12. CONFIGURACIÓN VISUAL
-- ========================================
CREATE TABLE configuracion_visual (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion VARCHAR(255),
    tipo ENUM('texto', 'numero', 'booleano', 'json') DEFAULT 'texto',
    activo BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_clave (clave),
    INDEX idx_activo (activo)
);

-- ========================================
-- 13. DATOS INICIALES OBLIGATORIOS
-- ========================================

-- Facultad por defecto
INSERT INTO facultades (nombre, codigo) VALUES 
('Facultad General', 'GRAL'),
('Facultad de Ingeniería', 'ING'),
('Facultad de Ciencias Económicas', 'ECO');

-- Aulas de UCASAL según configuración
INSERT INTO aulas (nombre, capacidad, tipoAula, ubicacion) VALUES 
('Aula 4', 72, 'regular', 'Primer Piso'),
('Aula 8', 71, 'regular', 'Primer Piso'),
('Aula 12', 69, 'regular', 'Planta Baja'),
('Laboratorio Informático', 34, 'laboratorio', 'Primer Piso');

-- Configuración visual inicial
INSERT INTO configuracion_visual (clave, valor, descripcion, tipo) VALUES 
('titulo_principal', 'TOTEM - UCASAL', 'Título principal del sistema', 'texto'),
('mostrar_mapas', 'true', 'Mostrar mapas de ubicación de aulas', 'booleano'),
('capacidad_minima_aula', '30', 'Capacidad mínima para considerar un aula', 'numero');

-- ========================================
-- 14. VERIFICACIÓN DE INSTALACIÓN
-- ========================================
SELECT 
    'INSTALACIÓN COMPLETADA' as estado,
    COUNT(*) as total_tablas
FROM information_schema.tables 
WHERE table_schema = 'totem_ucasal';

SELECT 
    'DATOS INICIALES' as tipo,
    (SELECT COUNT(*) FROM facultades) as facultades,
    (SELECT COUNT(*) FROM aulas) as aulas,
    (SELECT COUNT(*) FROM configuracion_visual) as configuraciones;

-- ========================================
-- 15. USUARIO DE APLICACIÓN (OPCIONAL)
-- ========================================
-- NOTA: Ejecutar solo si tienes permisos de administrador
-- CREATE USER 'totem_app'@'%' IDENTIFIED BY 'tu_password_segura_aqui';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON totem_ucasal.* TO 'totem_app'@'%';
-- FLUSH PRIVILEGES;

-- ¡SCRIPT COMPLETADO! ✅ 