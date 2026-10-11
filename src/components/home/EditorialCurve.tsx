import { cn } from "@/lib/utils";

interface EditorialCurveProps {
  className?: string;
  flip?: boolean;
}

export const EditorialCurve = ({ className, flip = false }: EditorialCurveProps) => (
  <svg
    viewBox="0 0 1200 180"
    preserveAspectRatio="none"
    aria-hidden="true"
    className={cn("editorial-curve", flip && "-scale-x-100", className)}
  >
    <path
      pathLength="1"
       d="M-100 150 C200 0 450 20 650 110 C850 200 1100 200 1400 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

export default EditorialCurve;
