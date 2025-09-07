export default function Placeholder({ title }: { title: string }) {
return (
    <div>
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-gray-700 dark:text-gray-300">Content goes here.</p>
    </div>
)
}