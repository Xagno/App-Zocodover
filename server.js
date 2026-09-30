```js
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ========================================
// MYSQL
// ========================================

const pool = mysql.createPool({

    host: process.env.DB_HOST,

    port: Number(
        process.env.DB_PORT || 3306
    ),

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0

});


// ========================================
// TEST DATABASE
// ========================================

async function testDatabase() {

    try {

        const connection =
            await pool.getConnection();

        await connection.query(
            "SELECT NOW()"
        );

        connection.release();

        console.log(
            "Base de datos MySQL conectada correctamente."
        );

    }

    catch (error) {

        console.error(
            "Error conectando a MySQL:",
            error
        );

    }

}

testDatabase();


// ========================================
// CONVERT DATABASE CLIENT
// ========================================

function formatClient(client) {

    let companyEmails =
        client.company_emails;

    if (
        typeof companyEmails === "string"
    ) {

        try {

            companyEmails =
                JSON.parse(companyEmails);

        }

        catch {

            companyEmails = [];

        }

    }

    if (
        !Array.isArray(companyEmails)
    ) {

        companyEmails = [];

    }


    return {

        id: client.id,

        name: client.name,

        rut: client.rut,

        legalRepresentative:
            client.legal_representative,

        companyEmails:
            companyEmails,

        startDate:
            client.start_date,

        expirationDate:
            client.expiration_date,

        plan:
            client.plan,

        manualStatus:
            client.manual_status,

        renewalCount:
            Number(
                client.renewal_count || 0
            )

    };

}


// ========================================
// GET CLIENTS
// ========================================

app.get(
    "/api/clients",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(`

                    SELECT
                        id,
                        name,
                        rut,
                        legal_representative,
                        company_emails,
                        start_date,
                        expiration_date,
                        plan,
                        manual_status,
                        renewal_count,
                        created_at,
                        updated_at

                    FROM clients

                    ORDER BY id ASC

                `);


            const clients =
                rows.map(
                    formatClient
                );


            res.json(clients);

        }

        catch (error) {

            console.error(
                "Error obteniendo clientes:",
                error
            );


            res.status(500).json({

                error:
                    "Error obteniendo clientes."

            });

        }

    }
);


// ========================================
// CREATE CLIENT
// ========================================

app.post(
    "/api/clients",
    async (req, res) => {

        try {

            const {

                name,

                rut,

                legalRepresentative,

                companyEmails,

                startDate,

                expirationDate,

                plan,

                manualStatus

            } = req.body;


            if (
                !name ||
                !rut ||
                !startDate ||
                !expirationDate ||
                !plan
            ) {

                return res.status(400).json({

                    error:
                        "Faltan datos obligatorios."

                });

            }


            const emails =
                Array.isArray(companyEmails)
                    ? companyEmails
                    : [];


            const [result] =
                await pool.execute(

                    `

                    INSERT INTO clients
                    (
                        name,
                        rut,
                        legal_representative,
                        company_emails,
                        start_date,
                        expiration_date,
                        plan,
                        manual_status,
                        renewal_count
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        0
                    )

                    `,

                    [

                        name,

                        rut,

                        legalRepresentative ||
                            null,

                        JSON.stringify(
                            emails
                        ),

                        startDate,

                        expirationDate,

                        plan,

                        manualStatus ||
                            "AUTO"

                    ]

                );


            const [rows] =
                await pool.execute(

                    `

                    SELECT *

                    FROM clients

                    WHERE id = ?

                    `,

                    [result.insertId]

                );


            res.status(201).json(

                formatClient(
                    rows[0]
                )

            );

        }

        catch (error) {

            console.error(
                "Error creando cliente:",
                error
            );


            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res.status(400).json({

                    error:
                        "Ese RUT ya existe."

                });

            }


            res.status(500).json({

                error:
                    "Error creando cliente."

            });

        }

    }
);


// ========================================
// UPDATE CLIENT
// ========================================

app.put(
    "/api/clients/:id",
    async (req, res) => {

        try {

            const { id } =
                req.params;


            const {

                name,

                rut,

                legalRepresentative,

                companyEmails,

                startDate,

                expirationDate,

                plan,

                manualStatus

            } = req.body;


            if (
                !name ||
                !rut ||
                !startDate ||
                !expirationDate ||
                !plan
            ) {

                return res.status(400).json({

                    error:
                        "Faltan datos obligatorios."

                });

            }


            const emails =
                Array.isArray(companyEmails)
                    ? companyEmails
                    : [];


            const [result] =
                await pool.execute(

                    `

                    UPDATE clients

                    SET

                        name = ?,

                        rut = ?,

                        legal_representative = ?,

                        company_emails = ?,

                        start_date = ?,

                        expiration_date = ?,

                        plan = ?,

                        manual_status = ?,

                        updated_at = NOW()

                    WHERE id = ?

                    `,

                    [

                        name,

                        rut,

                        legalRepresentative ||
                            null,

                        JSON.stringify(
                            emails
                        ),

                        startDate,

                        expirationDate,

                        plan,

                        manualStatus ||
                            "AUTO",

                        id

                    ]

                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    error:
                        "Cliente no encontrado."

                });

            }


            const [rows] =
                await pool.execute(

                    `

                    SELECT *

                    FROM clients

                    WHERE id = ?

                    `,

                    [id]

                );


            res.json(

                formatClient(
                    rows[0]
                )

            );

        }

        catch (error) {

            console.error(
                "Error actualizando cliente:",
                error
            );


            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res.status(400).json({

                    error:
                        "Ese RUT ya existe."

                });

            }


            res.status(500).json({

                error:
                    "Error actualizando cliente."

            });

        }

    }
);


// ========================================
// RENEW CONTRACT
// ========================================

app.post(
    "/api/clients/:id/renew",
    async (req, res) => {

        const clientId =
            req.params.id;

        const connection =
            await pool.getConnection();


        try {

            const {
                newExpirationDate
            } = req.body;


            if (!newExpirationDate) {

                return res.status(400).json({

                    error:
                        "Debes indicar la nueva fecha de expiración."

                });

            }


            await connection.beginTransaction();


            const [currentRows] =
                await connection.execute(

                    `

                    SELECT
                        id,
                        expiration_date,
                        manual_status,
                        renewal_count

                    FROM clients

                    WHERE id = ?

                    FOR UPDATE

                    `,

                    [clientId]

                );


            if (
                currentRows.length === 0
            ) {

                await connection.rollback();

                return res.status(404).json({

                    error:
                        "Cliente no encontrado."

                });

            }


            const current =
                currentRows[0];


            // ====================================
            // SOLO CONTRATOS ABIERTOS
            // ====================================

            if (
                current.manual_status ===
                "CERRADO"
            ) {

                await connection.rollback();

                return res.status(400).json({

                    error:
                        "No se puede renovar un contrato cerrado."

                });

            }


            const previousExpiration =
                String(
                    current.expiration_date
                ).substring(0, 10);


            if (
                newExpirationDate <=
                previousExpiration
            ) {

                await connection.rollback();

                return res.status(400).json({

                    error:
                        "La nueva fecha de expiración debe ser posterior a la actual."

                });

            }


            // ====================================
            // GUARDAR HISTORIAL
            // ====================================

            await connection.execute(

                `

                INSERT INTO contract_renewals
                (
                    client_id,
                    previous_expiration_date,
                    new_expiration_date
                )

                VALUES
                (
                    ?,
                    ?,
                    ?
                )

                `,

                [

                    clientId,

                    previousExpiration,

                    newExpirationDate

                ]

            );


            // ====================================
            // ACTUALIZAR CLIENTE
            // ====================================

            await connection.execute(

                `

                UPDATE clients

                SET

                    expiration_date = ?,

                    renewal_count =
                        renewal_count + 1,

                    last_renewed_at =
                        NOW(),

                    updated_at =
                        NOW()

                WHERE id = ?

                `,

                [

                    newExpirationDate,

                    clientId

                ]

            );


            const [updatedRows] =
                await connection.execute(

                    `

                    SELECT *

                    FROM clients

                    WHERE id = ?

                    `,

                    [clientId]

                );


            await connection.commit();


            res.json(

                formatClient(
                    updatedRows[0]
                )

            );

        }

        catch (error) {

            try {

                await connection.rollback();

            }

            catch (rollbackError) {

                console.error(
                    rollbackError
                );

            }


            console.error(
                "Error renovando contrato:",
                error
            );


            res.status(500).json({

                error:
                    "Error renovando contrato."

            });

        }

        finally {

            connection.release();

        }

    }
);


// ========================================
// RENEWAL HISTORY
// ========================================

app.get(
    "/api/clients/:id/renewals",
    async (req, res) => {

        try {

            const [rows] =
                await pool.execute(

                    `

                    SELECT

                        id,

                        renewed_at,

                        previous_expiration_date,

                        new_expiration_date

                    FROM contract_renewals

                    WHERE client_id = ?

                    ORDER BY renewed_at DESC

                    `,

                    [req.params.id]

                );


            res.json(rows);

        }

        catch (error) {

            console.error(
                "Error obteniendo renovaciones:",
                error
            );


            res.status(500).json({

                error:
                    "Error obteniendo historial de renovaciones."

            });

        }

    }
);


// ========================================
// DELETE CLOSED CLIENT
// ========================================

app.delete(
    "/api/clients/:id",
    async (req, res) => {

        try {

            const [result] =
                await pool.execute(

                    `

                    DELETE FROM clients

                    WHERE
                        id = ?

                        AND manual_status = 'CERRADO'

                    `,

                    [req.params.id]

                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(400).json({

                    error:
                        "Solo se pueden eliminar contratos cerrados."

                });

            }


            res.json({

                success: true

            });

        }

        catch (error) {

            console.error(
                "Error eliminando cliente:",
                error
            );


            res.status(500).json({

                error:
                    "Error eliminando cliente."

            });

        }

    }
);


// ========================================
// TEMPORARY MIGRATION
// ========================================
//
// ESTA RUTA ES TEMPORAL.
//
// Sirve para importar los 152 clientes
// desde clients_rows.csv.
//
// Después de terminar la migración,
// ELIMINAREMOS COMPLETAMENTE ESTA RUTA.
//

const MIGRATION_KEY =
    process.env.MIGRATION_KEY;


// IMPORT CLIENTS
app.post(
    "/api/migration/clients",
    async (req, res) => {

        try {

            // ------------------------------------
            // SECURITY CHECK
            // ------------------------------------

            if (
                !MIGRATION_KEY ||
                req.headers["x-migration-key"] !==
                    MIGRATION_KEY
            ) {

                return res.status(401).json({

                    error:
                        "Unauthorized."

                });

            }


            const clients =
                req.body.clients;


            if (
                !Array.isArray(clients)
            ) {

                return res.status(400).json({

                    error:
                        "El campo clients debe ser un arreglo."

                });

            }


            console.log(
                `Iniciando migración de ${clients.length} clientes...`
            );


            let inserted = 0;

            let skipped = 0;


            // ------------------------------------
            // INSERT CLIENTS
            // ------------------------------------

            for (
                const client of clients
            ) {

                if (
                    !client.id ||
                    !client.name ||
                    !client.rut
                ) {

                    console.warn(
                        "Cliente omitido por datos incompletos:",
                        client
                    );

                    skipped++;

                    continue;

                }


                const emails =
                    Array.isArray(
                        client.company_emails
                    )
                        ? client.company_emails
                        : [];


                try {

                    await pool.execute(

                        `

                        INSERT INTO clients
                        (
                            id,
                            name,
                            rut,
                            payment,
                            start_date,
                            expiration_date,
                            plan,
                            manual_status,
                            created_at,
                            updated_at,
                            legal_representative,
                            company_emails,
                            renewal_count,
                            last_renewed_at
                        )

                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )

                        `,

                        [

                            client.id,

                            client.name,

                            client.rut,

                            client.payment ||
                                "AL DIA",

                            client.start_date,

                            client.expiration_date,

                            client.plan,

                            client.manual_status ||
                                "AUTO",

                            client.created_at ||
                                null,

                            client.updated_at ||
                                null,

                            client.legal_representative ||
                                null,

                            JSON.stringify(
                                emails
                            ),

                            Number(
                                client.renewal_count ||
                                0
                            ),

                            client.last_renewed_at ||
                                null

                        ]

                    );


                    inserted++;

                }

                catch (error) {

                    // --------------------------------
                    // DUPLICATE
                    // --------------------------------

                    if (
                        error.code ===
                        "ER_DUP_ENTRY"
                    ) {

                        console.log(
                            `Cliente ya existe, omitido: ${client.id} - ${client.rut}`
                        );

                        skipped++;

                    }

                    else {

                        console.error(
                            `Error insertando cliente ${client.id}:`,
                            error
                        );

                        throw error;

                    }

                }

            }


            // ------------------------------------
            // FIX AUTO_INCREMENT
            // ------------------------------------

           


            console.log(
                `Migración terminada. Insertados: ${inserted}. Omitidos: ${skipped}.`
            );


            res.json({

                success: true,

                inserted: inserted,

                skipped: skipped,

                totalReceived:
                    clients.length

            });

        }

        catch (error) {

            console.error(
                "ERROR EN MIGRACIÓN:",
                error
            );


            res.status(500).json({

                error:
                    "Error durante la migración.",

                details:
                    error.message

            });

        }

    }
);


// ========================================
// MIGRATION STATUS
// ========================================
//
// Permite comprobar cuántos clientes
// existen actualmente en MySQL.
//

app.get(
    "/api/migration/status",
    async (req, res) => {

        try {

            if (
                !MIGRATION_KEY ||
                req.headers["x-migration-key"] !==
                    MIGRATION_KEY
            ) {

                return res.status(401).json({

                    error:
                        "Unauthorized."

                });

            }


            const [clientRows] =
                await pool.query(`

                    SELECT
                        COUNT(*) AS total

                    FROM clients

                `);


            const [renewalRows] =
                await pool.query(`

                    SELECT
                        COUNT(*) AS total

                    FROM contract_renewals

                `);


            res.json({

                clients:
                    Number(
                        clientRows[0].total
                    ),

                renewals:
                    Number(
                        renewalRows[0].total
                    )

            });

        }

        catch (error) {

            console.error(
                "Error comprobando migración:",
                error
            );


            res.status(500).json({

                error:
                    "Error comprobando estado."

            });

        }

    }
);


// ========================================
// START SERVER
// ========================================

app.listen(
    PORT,
    () => {

        console.log(

            `Zocodover funcionando en http://localhost:${PORT}`

        );

    }
);
```
