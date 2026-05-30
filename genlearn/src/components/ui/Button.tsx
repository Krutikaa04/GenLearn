type ButtonProps = {
  text: string;
};

export default function Button({ text }: ButtonProps) {
  return (
    <button className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700">
      {text}
    </button>
  );
}