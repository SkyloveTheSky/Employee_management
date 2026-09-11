export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-gray-300 text-bootstrap-primary shadow-sm focus:ring-bootstrap-primary ' +
                className
            }
        />
    );
}
