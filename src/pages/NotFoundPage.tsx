import { Link } from "react-router-dom";
import { Button, Icon } from "@/components/ui";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-subtle px-margin-mobile text-center">
      <Icon className="text-[40px] text-outline" name="explore_off" />
      <h1 className="mt-stack-md font-headline-md text-headline-md text-on-surface">
        This page does not exist
      </h1>
      <p className="mt-stack-sm max-w-md font-body-md text-body-md text-on-surface-variant">
        The link may be out of date, or the page may require a different account role.
      </p>
      <Link className="mt-stack-lg" to="/">
        <Button icon="home">Back to home</Button>
      </Link>
    </div>
  );
}
