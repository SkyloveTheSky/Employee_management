import React, { useEffect, useState } from "react";

export default function EmployeeBlock({ widget, userId, isSelected = false, onClick }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (!userId) return;

        fetch(route("admin.employee.widget.show", userId))
            .then((res) => res.json())
            .then(setUser);
    }, [userId]);

    return (
        <div onClick={onClick} style={{ ...widget.style, position: "relative" }}>
            {isSelected && <div>EMPLOYÉ</div>}

            <div>
                <strong>
                    {user?.first_name} {user?.last_name}
                </strong>

                <p>{user?.email}</p>
                <p>{user?.phone}</p>
                <p>Poste: {user?.position}</p>
                <p>Embauche: {user?.hire_date}</p>
                <p>Salaire: {user?.salary_base} Ar</p>
            </div>
        </div>
    );
}
