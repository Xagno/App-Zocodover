// ========================================
// ZOCODOVER - APP.JS
// ========================================

let clients = [];

let editingClientId = null;

let renewingClientId = null;


// ========================================
// ELEMENTOS
// ========================================

const clientTable =
    document.getElementById(
        "clientTable"
    );


const closedClientTable =
    document.getElementById(
        "closedClientTable"
    );


const openContractsCount =
    document.getElementById(
        "openContractsCount"
    );


const closedContractsCount =
    document.getElementById(
        "closedContractsCount"
    );


const addClientButton =
    document.getElementById(
        "addClientButton"
    );


const clientModal =
    document.getElementById(
        "clientModal"
    );


const cancelButton =
    document.getElementById(
        "cancelButton"
    );


const clientForm =
    document.getElementById(
        "clientForm"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const sortSelect =
    document.getElementById(
        "sortSelect"
    );


const modalTitle =
    document.getElementById(
        "modalTitle"
    );


const statusInput =
    document.getElementById(
        "status"
    );


const renewModal =
    document.getElementById(
        "renewModal"
    );


const renewClientName =
    document.getElementById(
        "renewClientName"
    );


const renewCurrentExpiration =
    document.getElementById(
        "renewCurrentExpiration"
    );


const newExpirationDate =
    document.getElementById(
        "newExpirationDate"
    );


const cancelRenewButton =
    document.getElementById(
        "cancelRenewButton"
    );


const confirmRenewButton =
    document.getElementById(
        "confirmRenewButton"
    );


// ========================================
// CARGAR CLIENTES
// ========================================

async function loadClients() {

    try {

        const response =
            await fetch(
                "/api/clients"
            );


        if (!response.ok) {

            throw new Error(
                "No se pudieron obtener los clientes."
            );

        }


        clients =
            await response.json();


        displayClients();

    }

    catch (error) {

        console.error(error);


        alert(
            "Error conectando con la base de datos."
        );

    }

}


// ========================================
// FORMATEAR RUT
// ========================================

function formatRut(rut) {

    if (!rut) {

        return "";

    }


    let cleanRut =
        rut
            .toUpperCase()
            .replace(
                /[^0-9K]/g,
                ""
            );


    if (
        cleanRut.length < 2
    ) {

        return cleanRut;

    }


    const dv =
        cleanRut.slice(-1);


    let number =
        cleanRut.slice(0, -1);


    let formatted = "";


    while (
        number.length > 3
    ) {

        formatted =
            "." +
            number.slice(-3) +
            formatted;


        number =
            number.slice(0, -3);

    }


    formatted =
        number +
        formatted;


    return (
        formatted +
        "-" +
        dv
    );

}


// ========================================
// VALIDAR RUT
// ========================================

function isValidRut(rut) {

    if (!rut) {

        return false;

    }


    const cleanRut =
        rut
            .toUpperCase()
            .replace(
                /\./g,
                ""
            )
            .replace(
                /-/g,
                ""
            );


    if (
        !/^\d{7,8}[0-9K]$/.test(
            cleanRut
        )
    ) {

        return false;

    }


    const number =
        cleanRut.slice(
            0,
            -1
        );


    const dv =
        cleanRut.slice(-1);


    let multiplier = 2;

    let sum = 0;


    for (
        let i =
            number.length - 1;

        i >= 0;

        i--
    ) {

        sum +=
            Number(
                number[i]
            ) *
            multiplier;


        multiplier++;


        if (
            multiplier > 7
        ) {

            multiplier = 2;

        }

    }


    const remainder =
        11 -
        (
            sum % 11
        );


    let calculatedDv;


    if (
        remainder === 11
    ) {

        calculatedDv = "0";

    }

    else if (
        remainder === 10
    ) {

        calculatedDv = "K";

    }

    else {

        calculatedDv =
            remainder.toString();

    }


    return (
        calculatedDv === dv
    );

}


// ========================================
// FORMATEAR FECHA
// ========================================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const parts = dateString
        .substring(0, 10)
        .split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const months = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic"
    ];

    const year = parts[0];
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    return `${day} ${months[month - 1]} ${year}`;
}

// ========================================
// ESTADO AUTOMÁTICO
// ========================================

function getAutomaticStatus(client) {

    if (
        client.manualStatus ===
        "CERRADO"
    ) {

        return "CERRADO";

    }


    if (
        !client.expirationDate
    ) {

        return "ACTIVO";

    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const expiration =
        new Date(
            client.expirationDate
                .substring(0, 10) +
            "T00:00:00"
        );


    expiration.setHours(
        0,
        0,
        0,
        0
    );


    if (
        expiration < today
    ) {

        return "VENCIDO";

    }


    const oneMonthFromToday =
        new Date(today);


    oneMonthFromToday.setMonth(
        oneMonthFromToday.getMonth() + 1
    );


    if (
        expiration <=
        oneMonthFromToday
    ) {

        return "RENOVAR";

    }


    return "ACTIVO";

}


// ========================================
// CLASE CSS ESTADO
// ========================================

function getStatusClass(status) {

    if (
        status === "ACTIVO"
    ) {

        return "status-active";

    }


    if (
        status === "RENOVAR"
    ) {

        return "status-renew";

    }


    if (
        status === "VENCIDO"
    ) {

        return "status-expired";

    }


    if (
        status === "CERRADO"
    ) {

        return "status-closed";

    }


    return "";

}


// ========================================
// OBTENER CORREOS
// ========================================

function getEmails(client) {

    if (
        !Array.isArray(
            client.companyEmails
        )
    ) {

        return [];

    }


    return client.companyEmails
        .filter(
            email =>
                email &&
                email.trim()
        );

}


// ========================================
// ORDENAR CLIENTES
// ========================================

function sortClients(clientList) {

    const sorted =
        [...clientList];


    const value =
        sortSelect.value;


    sorted.sort(
        (a, b) => {

            switch (value) {

                case "name-asc":

                    return (
                        (a.name || "")
                            .localeCompare(
                                b.name || "",
                                "es",
                                {
                                    sensitivity:
                                        "base"
                                }
                            )
                    );


                case "name-desc":

                    return (
                        (b.name || "")
                            .localeCompare(
                                a.name || "",
                                "es",
                                {
                                    sensitivity:
                                        "base"
                                }
                            )
                    );


                case "expiration-asc":

                    return compareDates(
                        a.expirationDate,
                        b.expirationDate
                    );


                case "expiration-desc":

                    return compareDates(
                        b.expirationDate,
                        a.expirationDate
                    );


                case "start-asc":

                    return compareDates(
                        a.startDate,
                        b.startDate
                    );


                case "start-desc":

                    return compareDates(
                        b.startDate,
                        a.startDate
                    );


                case "renewals-desc":

                    return (
                        Number(
                            b.renewalCount || 0
                        ) -
                        Number(
                            a.renewalCount || 0
                        )
                    );


                case "renewals-asc":

                    return (
                        Number(
                            a.renewalCount || 0
                        ) -
                        Number(
                            b.renewalCount || 0
                        )
                    );


                default:

                    return (
                        Number(a.id) -
                        Number(b.id)
                    );

            }

        }
    );


    return sorted;

}


// ========================================
// COMPARAR FECHAS
// ========================================

function compareDates(
    first,
    second
) {

    if (!first && !second) {

        return 0;

    }


    if (!first) {

        return 1;

    }


    if (!second) {

        return -1;

    }


    return (
        new Date(first) -
        new Date(second)
    );

}


// ========================================
// MOSTRAR CLIENTES
// ========================================

function displayClients() {

    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    let filteredClients =
        clients.filter(
            client => {

                if (!search) {

                    return true;

                }


                const name =
                    (
                        client.name ||
                        ""
                    ).toLowerCase();


                const rut =
                    (
                        client.rut ||
                        ""
                    ).toLowerCase();


                const representative =
                    (
                        client.legalRepresentative ||
                        ""
                    ).toLowerCase();


                const emails =
                    getEmails(client)
                        .join(" ")
                        .toLowerCase();


                return (

                    name.includes(search) ||

                    rut.includes(search) ||

                    representative.includes(search) ||

                    emails.includes(search)

                );

            }
        );


    filteredClients =
        sortClients(
            filteredClients
        );


    const openClients =
        filteredClients.filter(
            client =>
                client.manualStatus !==
                "CERRADO"
        );


    const closedClients =
        filteredClients.filter(
            client =>
                client.manualStatus ===
                "CERRADO"
        );


    const allOpenClients =
        clients.filter(
            client =>
                client.manualStatus !==
                "CERRADO"
        );


    const allClosedClients =
        clients.filter(
            client =>
                client.manualStatus ===
                "CERRADO"
        );


    openContractsCount.textContent =
        allOpenClients.length;


    closedContractsCount.textContent =
        allClosedClients.length;


    clientTable.innerHTML =
        "";


    closedClientTable.innerHTML =
        "";


    if (
        openClients.length === 0
    ) {

        clientTable.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-row"
                >
                    No hay contratos abiertos.
                </td>

            </tr>

        `;

    }

    else {

        openClients.forEach(
            client => {

                clientTable.appendChild(

                    createClientRow(
                        client,
                        false
                    )

                );

            }
        );

    }


    if (
        closedClients.length === 0
    ) {

        closedClientTable.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-row"
                >
                    No hay contratos cerrados.
                </td>

            </tr>

        `;

    }

    else {

        closedClients.forEach(
            client => {

                closedClientTable.appendChild(

                    createClientRow(
                        client,
                        true
                    )

                );

            }
        );

    }

}


// ========================================
// CREAR FILA
// ========================================

function createClientRow(
    client,
    isClosed
) {

    const row =
        document.createElement(
            "tr"
        );


    const status =
        getAutomaticStatus(
            client
        );


    let actionButton;


    if (isClosed) {

        actionButton = `

            <button
                class="details-button"
                onclick="toggleClientDetails(this, ${client.id})"
            >
                Detalles
            </button>


            <button
                class="edit-button"
                onclick="editClient(${client.id})"
            >
                Editar
            </button>


            <button
                class="open-button"
                onclick="reopenClient(${client.id})"
            >
                Abrir
            </button>


            <button
                class="delete-button"
                onclick="deleteClient(${client.id})"
            >
                Eliminar
            </button>

        `;

    }

    else {

        actionButton = `

            <button
                class="details-button"
                onclick="toggleClientDetails(this, ${client.id})"
            >
                Detalles
            </button>


            <button
                class="edit-button"
                onclick="editClient(${client.id})"
            >
                Editar
            </button>


            <button
                class="renew-button"
                onclick="openRenewModal(${client.id})"
            >
                Renovar
            </button>


            <button
                class="close-button"
                onclick="closeClient(${client.id})"
            >
                Cerrar
            </button>

        `;

    }


    row.innerHTML = `

        <td>
            ${escapeHtml(client.name)}
        </td>


        <td>
            ${escapeHtml(client.rut)}
        </td>


        <td
            class="${getStatusClass(status)}"
        >
            ${status}
        </td>


        <td>
            ${formatDate(
                client.startDate
            )}
        </td>


        <td>
            ${formatDate(
                client.expirationDate
            )}
        </td>


        <td>
            ${escapeHtml(
                client.plan
            )}
        </td>



        <td class="actions-cell">

            ${actionButton}

        </td>

    `;


    return row;

}


// ========================================
// DETALLES DEL CLIENTE
// ========================================

window.toggleClientDetails =
    async function(button, id) {

        const client =
            clients.find(
                client =>
                    Number(client.id) ===
                    Number(id)
            );


        if (!client) {

            return;

        }


        const currentRow =
            button.closest("tr");


        const nextRow =
            currentRow.nextElementSibling;


        // Si ya está abierto, cerrarlo
        if (
            nextRow &&
            nextRow.classList.contains(
                "client-details-row"
            )
        ) {

            nextRow.remove();

            button.textContent =
                "Detalles";

            return;

        }


        // Crear fila de detalles
        const detailsRow =
            document.createElement(
                "tr"
            );


        detailsRow.className =
            "client-details-row";


        detailsRow.innerHTML = `

            <td
                colspan="8"
                class="client-details-cell"
            >

                <div class="client-details-box">

                    <div class="client-detail">

                        <span class="detail-label">
                            Representante legal
                        </span>

                        <span class="detail-value">

                            ${escapeHtml(
                                client.legalRepresentative ||
                                "—"
                            )}

                        </span>

                    </div>


                    <div class="client-detail">

                        <span class="detail-label">
                            Correos de la empresa
                        </span>

                        <span class="detail-value">

                            ${
                                getEmails(client).length > 0

                                    ? getEmails(client)
                                        .map(
                                            email => `
                                                <div class="email-detail">
                                                    ${escapeHtml(email)}
                                                </div>
                                            `
                                        )
                                        .join("")

                                    : `<span class="empty-value">—</span>`
                            }

                        </span>

                    </div>


                    <div class="client-detail">

                        <span class="detail-label">
                            Última renovación
                        </span>

                        <span
                            class="detail-value"
                            id="lastRenewal-${client.id}"
                        >
                            Cargando...
                        </span>

                    </div>

                </div>


                <div class="renewal-details-section">

                    <div class="renewal-details-title">
                        Historial de renovaciones
                    </div>

                    <div
                        id="renewalDetails-${client.id}"
                        class="renewal-details-content"
                    >
                        Cargando historial...
                    </div>

                </div>

            </td>

        `;


        currentRow.parentNode.insertBefore(
            detailsRow,
            currentRow.nextSibling
        );


        button.textContent =
            "Ocultar";


        // Cargar historial
        try {

            const response =
                await fetch(
                    `/api/clients/${id}/renewals`
                );


            const history =
                await response.json();


            const historyContainer =
                document.getElementById(
                    `renewalDetails-${client.id}`
                );


            const lastRenewalContainer =
                document.getElementById(
                    `lastRenewal-${client.id}`
                );


            if (!response.ok) {

                throw new Error(
                    history.error ||
                    "No se pudo obtener el historial."
                );

            }


            // ====================================
            // ÚLTIMA RENOVACIÓN
            // ====================================

            if (
                history.length === 0
            ) {

                lastRenewalContainer.textContent =
                    "Nunca";

                historyContainer.innerHTML = `

                    <div class="empty-history">

                        Este contrato todavía
                        no ha sido renovado.

                    </div>

                `;

            }

            else {

                lastRenewalContainer.textContent =
                    formatDateTime(
                        history[0].renewed_at
                    );


                historyContainer.innerHTML =
                    history
                        .map(
                            (renewal, index) => `

                                <div
                                    class="renewal-history-item"
                                >

                                    <strong>
                                        Renovación #${
                                            history.length -
                                            index
                                        }
                                    </strong>


                                    <div>

                                        Renovado el:

                                        ${formatDateTime(
                                            renewal.renewed_at
                                        )}

                                    </div>


                                    <div>

                                        Expiración anterior:

                                        ${formatDate(
                                            renewal.previous_expiration_date
                                        )}

                                    </div>


                                    <div>

                                        Nueva expiración:

                                        ${formatDate(
                                            renewal.new_expiration_date
                                        )}

                                    </div>

                                </div>

                            `
                        )
                        .join("");

            }

        }

        catch (error) {

            console.error(
                error
            );


            const historyContainer =
                document.getElementById(
                    `renewalDetails-${client.id}`
                );


            const lastRenewalContainer =
                document.getElementById(
                    `lastRenewal-${client.id}`
                );


            if (
                lastRenewalContainer
            ) {

                lastRenewalContainer.textContent =
                    "No disponible";

            }


            if (
                historyContainer
            ) {

                historyContainer.innerHTML = `

                    <p class="history-error">
                        ${escapeHtml(
                            error.message
                        )}
                    </p>

                `;

            }

        }

    };


// ========================================
// ESCAPAR HTML
// ========================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ========================================
// CONVERTIR CORREOS
// ========================================

function parseEmails(value) {

    return value

        .split(/\r?\n|,|;/)

        .map(
            email =>
                email.trim()
        )

        .filter(
            email =>
                email.length > 0
        );

}


// ========================================
// VALIDAR CORREOS
// ========================================

function validateEmails(emails) {

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return emails.every(
        email =>
            emailRegex.test(
                email
            )
    );

}


// ========================================
// AGREGAR CLIENTE
// ========================================

addClientButton.addEventListener(
    "click",
    () => {

        editingClientId =
            null;


        clientForm.reset();


        modalTitle.textContent =
            "Agregar cliente";


        statusInput.value =
            "AUTO";


        clientModal.style.display =
            "flex";

    }
);


// ========================================
// CANCELAR
// ========================================

cancelButton.addEventListener(
    "click",
    () => {

        closeModal();

    }
);


// ========================================
// CERRAR MODAL
// ========================================

function closeModal() {

    clientModal.style.display =
        "none";


    clientForm.reset();


    editingClientId =
        null;

}


// ========================================
// GUARDAR CLIENTE
// ========================================

clientForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            document.getElementById(
                "name"
            ).value.trim();


        const rutInput =
            document.getElementById(
                "rut"
            ).value.trim();


        const legalRepresentative =
            document.getElementById(
                "legalRepresentative"
            ).value.trim();


        const emailText =
            document.getElementById(
                "companyEmails"
            ).value.trim();


        const companyEmails =
            parseEmails(
                emailText
            );


        const startDate =
            document.getElementById(
                "startDate"
            ).value;


        const expirationDate =
            document.getElementById(
                "expirationDate"
            ).value;


        const plan =
            document.getElementById(
                "plan"
            ).value;


        const manualStatus =
            statusInput.value;


        if (
            !isValidRut(
                rutInput
            )
        ) {

            alert(
                "El RUT ingresado no es válido."
            );

            return;

        }


        const rut =
            formatRut(
                rutInput
            );


        if (
            !validateEmails(
                companyEmails
            )
        ) {

            alert(
                "Uno o más correos electrónicos no son válidos."
            );

            return;

        }


        if (
            expirationDate <
            startDate
        ) {

            alert(
                "La fecha de expiración no puede ser anterior a la fecha de inicio."
            );

            return;

        }


        const clientData = {

            name,

            rut,

            legalRepresentative,

            companyEmails,

            startDate,

            expirationDate,

            plan,

            manualStatus

        };


        try {

            let response;


            if (
                editingClientId
            ) {

                response =
                    await fetch(

                        `/api/clients/${editingClientId}`,

                        {

                            method:
                                "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    clientData
                                )

                        }

                    );

            }

            else {

                response =
                    await fetch(

                        "/api/clients",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    clientData
                                )

                        }

                    );

            }


            const result =
                await response.json();


            if (
                !response.ok
            ) {

                throw new Error(
                    result.error ||
                    "Error guardando cliente."
                );

            }


            await loadClients();


            closeModal();

        }

        catch (error) {

            console.error(
                error
            );


            alert(
                error.message
            );

        }

    }
);


// ========================================
// EDITAR CLIENTE
// ========================================

window.editClient =
    function(id) {

        const client =
            clients.find(
                client =>
                    Number(client.id) ===
                    Number(id)
            );


        if (!client) {

            alert(
                "No se encontró el cliente."
            );

            return;

        }


        editingClientId =
            client.id;


        document.getElementById(
            "name"
        ).value =
            client.name || "";


        document.getElementById(
            "rut"
        ).value =
            client.rut || "";


        document.getElementById(
            "legalRepresentative"
        ).value =
            client.legalRepresentative ||
            "";


        document.getElementById(
            "companyEmails"
        ).value =
            getEmails(client)
                .join("\n");


        document.getElementById(
            "startDate"
        ).value =
            client.startDate
                .substring(0, 10);


        document.getElementById(
            "expirationDate"
        ).value =
            client.expirationDate
                .substring(0, 10);


        document.getElementById(
            "plan"
        ).value =
            client.plan;


        statusInput.value =
            client.manualStatus ||
            "AUTO";


        modalTitle.textContent =
            "Editar cliente";


        clientModal.style.display =
            "flex";

    };


// ========================================
// CERRAR CLIENTE
// ========================================

window.closeClient =
    async function(id) {

        const client =
            clients.find(
                client =>
                    Number(client.id) ===
                    Number(id)
            );


        if (!client) {

            return;

        }


        const confirmed =
            confirm(

                `¿Quieres cerrar el contrato de ${client.name}?`

            );


        if (!confirmed) {

            return;

        }


        await changeManualStatus(
            client,
            "CERRADO"
        );

    };


// ========================================
// REABRIR CLIENTE
// ========================================

window.reopenClient =
    async function(id) {

        const client =
            clients.find(
                client =>
                    Number(client.id) ===
                    Number(id)
            );


        if (!client) {

            return;

        }


        const confirmed =
            confirm(

                `¿Quieres volver a abrir el contrato de ${client.name}?`

            );


        if (!confirmed) {

            return;

        }


        await changeManualStatus(
            client,
            "AUTO"
        );

    };


// ========================================
// CAMBIAR ESTADO
// ========================================

async function changeManualStatus(
    client,
    manualStatus
) {

    const data = {

        name:
            client.name,

        rut:
            client.rut,

        legalRepresentative:
            client.legalRepresentative ||
            "",

        companyEmails:
            getEmails(client),

        startDate:
            client.startDate
                .substring(0, 10),

        expirationDate:
            client.expirationDate
                .substring(0, 10),

        plan:
            client.plan,

        manualStatus

    };


    try {

        const response =
            await fetch(

                `/api/clients/${client.id}`,

                {

                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            data
                        )

                }

            );


        const result =
            await response.json();


        if (
            !response.ok
        ) {

            throw new Error(
                result.error ||
                "No se pudo cambiar el estado."
            );

        }


        await loadClients();

    }

    catch (error) {

        console.error(
            error
        );


        alert(
            error.message
        );

    }

}


// ========================================
// ABRIR MODAL RENOVACIÓN
// ========================================

window.openRenewModal =
    function(id) {

        const client =
            clients.find(
                client =>
                    Number(client.id) ===
                    Number(id)
            );


        if (!client) {

            return;

        }


        renewingClientId =
            client.id;


        renewClientName.textContent =
            `Cliente: ${client.name}`;


        renewCurrentExpiration.textContent =
            formatDate(
                client.expirationDate
            );


        newExpirationDate.value =
            "";


        newExpirationDate.min =
            client.expirationDate
                .substring(0, 10);


        renewModal.style.display =
            "flex";

    };


// ========================================
// CERRAR MODAL RENOVACIÓN
// ========================================

function closeRenewModal() {

    renewModal.style.display =
        "none";


    renewingClientId =
        null;


    newExpirationDate.value =
        "";

}


// ========================================
// CANCELAR RENOVACIÓN
// ========================================

cancelRenewButton.addEventListener(
    "click",
    () => {

        closeRenewModal();

    }
);


// ========================================
// CONFIRMAR RENOVACIÓN
// ========================================

confirmRenewButton.addEventListener(
    "click",
    async () => {

        if (!renewingClientId) {

            return;

        }


        const newDate =
            newExpirationDate.value;


        if (!newDate) {

            alert(
                "Selecciona una nueva fecha de expiración."
            );

            return;

        }


        const client =
            clients.find(
                client =>
                    Number(client.id) ===
                    Number(renewingClientId)
            );


        if (!client) {

            return;

        }


        const oldDate =
            client.expirationDate
                .substring(0, 10);


        if (
            newDate <= oldDate
        ) {

            alert(
                "La nueva fecha debe ser posterior a la fecha de expiración actual."
            );

            return;

        }


        const confirmed =
            confirm(

                `¿Renovar el contrato de ${client.name} hasta el ${formatDate(newDate)}?`

            );


        if (!confirmed) {

            return;

        }


        try {

            confirmRenewButton.disabled =
                true;


            confirmRenewButton.textContent =
                "Renovando...";


            const response =
                await fetch(

                    `/api/clients/${renewingClientId}/renew`,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                newExpirationDate:
                                    newDate

                            })

                    }

                );


            const result =
                await response.json();


            if (
                !response.ok
            ) {

                throw new Error(
                    result.error ||
                    "No se pudo renovar el contrato."
                );

            }


            await loadClients();


            closeRenewModal();

        }

        catch (error) {

            console.error(
                error
            );


            alert(
                error.message
            );

        }

        finally {

            confirmRenewButton.disabled =
                false;


            confirmRenewButton.textContent =
                "Renovar contrato";

        }

    }
);


// ========================================
// FORMATEAR FECHA Y HORA
// ========================================

function formatDateTime(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString
        );


    return date.toLocaleString(
        "es-CL",
        {
            dateStyle:
                "short",
            timeStyle:
                "short"
        }
    );

}


// ========================================
// ELIMINAR CLIENTE
// ========================================

window.deleteClient =
    async function(id) {

        const client =
            clients.find(
                client =>
                    Number(client.id) ===
                    Number(id)
            );


        if (!client) {

            return;

        }


        if (
            client.manualStatus !==
            "CERRADO"
        ) {

            alert(
                "Solo puedes eliminar contratos cerrados."
            );

            return;

        }


        const confirmed =
            confirm(

                `ATENCIÓN\n\n¿Quieres eliminar DEFINITIVAMENTE el contrato de ${client.name}?\n\nEsta acción no se puede deshacer.`

            );


        if (!confirmed) {

            return;

        }


        const secondConfirmation =
            prompt(

                `Para confirmar, escribe exactamente:\n\nELIMINAR\n\nContrato: ${client.name}`

            );


        if (
            secondConfirmation !==
            "ELIMINAR"
        ) {

            alert(
                "Eliminación cancelada."
            );

            return;

        }


        try {

            const response =
                await fetch(

                    `/api/clients/${id}`,

                    {

                        method:
                            "DELETE"

                    }

                );


            const result =
                await response.json();


            if (
                !response.ok
            ) {

                throw new Error(
                    result.error ||
                    "No se pudo eliminar el contrato."
                );

            }


            await loadClients();


            alert(
                "El contrato fue eliminado definitivamente."
            );

        }

        catch (error) {

            console.error(
                error
            );


            alert(
                error.message
            );

        }

    };


// ========================================
// BUSCADOR
// ========================================

const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(button => {

    button.addEventListener("click", () => {

        const target = button.dataset.tab;

        // Quitar active de todos los botones
        tabButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        // Quitar active de todas las tablas
        tabContents.forEach(content => {
            content.classList.remove("active");
        });

        // Activar botón seleccionado
        button.classList.add("active");

        // Activar tabla correspondiente
        document
            .getElementById(target)
            .classList.add("active");

    });

});

searchInput.addEventListener(
    "input",
    () => {

        displayClients();

    }
);


// ========================================
// ORDENAMIENTO
// ========================================

sortSelect.addEventListener(
    "change",
    () => {

        displayClients();

    }
);


// ========================================
// CLICK FUERA DE MODALES
// ========================================

clientModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            clientModal
        ) {

            closeModal();

        }

    }
);


renewModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            renewModal
        ) {

            closeRenewModal();

        }

    }
);


// ========================================
// INICIAR
// ========================================

loadClients();