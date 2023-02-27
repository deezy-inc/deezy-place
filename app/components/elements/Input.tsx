import { forwardRef } from "react";
import { classNames } from "~/utils";

type InputProps = {
  label: string;
  name: string;
  type: string;
  extraStyles?: string;
  noStyle?: boolean;
  error?: string | undefined | null;
};

export type Ref = HTMLInputElement;

export const Input = forwardRef<Ref, InputProps & React.InputHTMLAttributes<HTMLInputElement>>(
  ({ label, name, type, error, extraStyles = "", noStyle = false, ...rest }, ref) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="mt-1">
        <input
          id={name}
          name={name}
          type={type}
          ref={ref}
          {...rest}
          className={classNames(noStyle ? "" : "block w-full text-gray-300 appearance-none bg-gray-600 rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-yellow-500 sm:text-sm", extraStyles)}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  )
);

