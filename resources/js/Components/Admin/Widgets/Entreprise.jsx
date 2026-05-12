import React, { useEffect, useState } from "react";

export default function Entreprise({ widget, isSelected = false, onClick = null }) {
    const [company, setCompany] = useState(null);

    useEffect(() => {
        fetch(route("admin.company.widget"))
            .then((res) => res.json())
            .then((data) => setCompany(data));
    }, []);

    return (
        <div onClick={onClick} style={{ ...widget.style, position: "relative" }}>
            {isSelected && <div>ENTREPRISE</div>}

            <div>
                <strong>{company?.company_name}</strong>
                <p>{company?.owner_name}</p>
                <p>NIF: {company?.nif}</p>
                <p>STAT: {company?.stat}</p>
                <p>RCS: {company?.rcs}</p>

                {company?.logo_path && (
                    <img
                        src={`/storage/${company.logo_path}`}
                        style={{ height: 40 }}
                    />
                )}
            </div>
        </div>
    );
}
