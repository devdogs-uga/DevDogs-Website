import Link from "next/link";
import {
  PiArrowRightBold,
  PiEnvelopeSimpleFill,
  PiGithubLogoFill,
  PiInstagramLogoFill,
  PiLinkedinLogoFill
} from "react-icons/pi";
import LinkButton from "~/components/LinkButton";
import ShareButton from "./ShareButton";

export default function LinkInBio() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-12 py-4">
      <div className="flex w-full flex-col items-center gap-6">
        <p className="animate-wave cursor-default text-5xl">👋</p>
        <p className="text-center">
          <span className="inline-block">
            Hey, we&rsquo;re DevDogs, a club at UGA building
          </span>
          <span className="inline-block">
            software with an impact. Join us below!
          </span>
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <LinkButton
          href="/join"
          className="flex items-center justify-center gap-5 rounded-sm bg-rose-900 px-12 py-3 text-xl font-extrabold tracking-wide text-white ring-rose-900 hover:bg-rose-200 hover:text-rose-900"
        >
          Join DevDogs!
        </LinkButton>
        <Link
          href="?"
          className="flex items-center justify-center gap-2 rounded-sm bg-rose-300 px-4 py-2 font-medium text-black hover:underline"
          scroll={false}
        >
          Continue to Website
          <PiArrowRightBold />
        </Link>
      </div>

      <div className="flex w-full flex-col gap-3">
        <ShareButton
          href="https://uga.campuslabs.com/engage/organization/devdogs"
          title="UGA Involvement Network Listing"
          shareText=""
        />
        <ShareButton
          href="https://gdg.community.dev/gdg-on-campus-university-of-georgia-athens-united-states/"
          title="Google DGC: UGA Listing"
          shareText=""
        />
        <ShareButton
          href="https://docs.google.com/forms/d/e/1FAIpQLSfH6BQCUm96Q9rUu-WKVeG6qzM4tRrXzfwxj_Np8XJoZtlZJQ/viewform"
          title="Focus Lead Interest Form"
          shareText=""
        />
        <ShareButton
          href="https://forms.gle/7DFteDC9iGu5rVCL7"
          title="A-Team Interest Form"
          shareText=""
        />
      </div>

      <div className="flex gap-8 text-2xl text-rose-100">
        <Link
          className="transition-[scale,color] hover:scale-120 hover:text-rose-200"
          href="#"
          target="_blank"
        >
          <PiInstagramLogoFill />
        </Link>
        <Link
          className="transition-[scale,color] hover:scale-120 hover:text-rose-200"
          href="#"
          target="_blank"
        >
          <PiGithubLogoFill />
        </Link>
        <Link
          className="transition-[scale,color] hover:scale-120 hover:text-rose-200"
          href="#"
          target="_blank"
        >
          <PiLinkedinLogoFill />
        </Link>
        <Link
          className="transition-[scale,color] hover:scale-120 hover:text-rose-200"
          href="#"
          target="_blank"
        >
          <PiEnvelopeSimpleFill />
        </Link>
      </div>
    </div>
  );
}
