"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);
  
  return (
    <html lang="en">
      <body>
        <section className="bg-white font-serif min-h-screen flex items-center justify-center">
          <div className="container mx-auto">
            <div className="flex justify-center">
              <div className="w-full sm:w-10/12 md:w-8/12 text-center">
                <div
                  className="bg-[url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)] h-[250px] sm:h-[350px] md:h-[400px] bg-center bg-no-repeat bg-contain"
                  aria-hidden="true"
                >
                  <h1 className="text-center text-black text-6xl sm:text-7xl md:text-8xl pt-6 sm:pt-8">
                    Error
                  </h1>
                </div>

                <div className="mt-[-50px]">
                  <h3 className="text-2xl text-black sm:text-3xl font-bold mb-4">
                    Critical Error
                  </h3>
                  <p className="mb-6 text-black sm:mb-5">
                    We're sorry, but something went seriously wrong with the application.
                  </p>

                  <Button
                    variant="default"
                    onClick={() => reset()}
                    className="my-5 bg-blue-600 hover:bg-blue-700"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
} 