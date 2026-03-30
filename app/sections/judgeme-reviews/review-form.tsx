import { CheckIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type React from "react";
import { useRef, useState } from "react";
import { useLoaderData } from "react-router";
import { Button } from "~/components/button";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { loader as productRouteLoader } from "~/routes/products/product";
import { cn } from "~/utils/cn";
import { RatingInput } from "./rating-input";

type FormState = "idle" | "submitting" | "success" | "error";

interface ReviewFormProps extends React.HTMLAttributes<HTMLDivElement> {
  showForm: boolean;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ReviewForm({
  showForm,
  setShowForm,
  className,
}: ReviewFormProps) {
  const { product } = useLoaderData<typeof productRouteLoader>();
  const [rating, setRating] = useState(0);
  const [formState, setFormState] = useState<FormState>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const submitReviewAPI = usePrefixPathWithLocale(
    `/api/product/${product?.handle || ""}/reviews`,
  );

  function resetForm() {
    setRating(0);
    setFormState("idle");
    formRef.current?.reset();
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();

    if (!product?.handle) {
      setFormState("error");
      return;
    }

    // Check if rating is selected first
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    // Use native form validation for other fields
    if (!ev.currentTarget.checkValidity()) {
      return;
    }

    setFormState("submitting");
    fetch(submitReviewAPI, {
      method: "POST",
      body: new FormData(ev.currentTarget),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Response not ok");
        }
        return res.json() as Promise<{ review: unknown } | null>;
      })
      .then((data) => {
        if (data?.review) {
          setFormState("success");
        } else {
          throw new Error("Review submission failed");
        }
      })
      .catch((err) => {
        console.error("Error submitting review:", err);
        setFormState("error");
      });
  }

  return (
    <div
      className={cn(
        "w-full space-y-6 border border-gray-200 p-6 shadow transition-all duration-200 md:p-8",
        showForm ? "block" : "hidden",
        className,
      )}
    >
      <div
        className={cn(
          "space-y-4 py-4 text-center",
          formState === "success" ? "block" : "hidden",
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckIcon className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mb-2 font-semibold text-green-900 text-xl">
          Avaliação enviada com sucesso!
        </h3>
        <p className="text-gray-600">
          Obrigado pelo seu feedback. Sua avaliação está sendo processada e
          será publicada em breve.
        </p>
        <Button type="button" onClick={resetForm} className="mt-4">
          Escrever outra avaliação
        </Button>
      </div>
      <div
        className={cn(
          "space-y-4 py-4 text-center",
          formState === "error" ? "block" : "hidden",
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <WarningCircleIcon className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="mb-2 font-semibold text-red-900 text-xl">
          Falha no envio
        </h3>
        <p className="text-gray-600">
          Houve um erro ao enviar sua avaliação. Por favor, tente novamente.
        </p>
        <Button
          type="button"
          onClick={() => setFormState("idle")}
          className="mt-4"
        >
          Tentar novamente
        </Button>
      </div>
      <form
        ref={formRef}
        id="judgeme-review-form"
        onSubmit={handleSubmit}
        className={cn(
          "space-y-6",
          formState === "idle" || formState === "submitting"
            ? "block"
            : "hidden",
        )}
      >
        <div className="space-y-2">
          <h2 className="text-center font-bold text-2xl text-gray-900">
            Escreva sua avaliação
          </h2>
          <p className="text-center text-gray-600">
            Compartilhe sua experiência com outros clientes
          </p>
        </div>

        {/* Hidden product ID input */}
        {product?.id && (
          <input
            type="hidden"
            name="id"
            value={Number(product.id.split("/").pop())}
          />
        )}

        {/* Rating */}
        <RatingInput
          label="Rating"
          required
          name="rating"
          rating={rating}
          onRatingChange={setRating}
        />

        {/* Name */}
        <div className="space-y-2">
          <label
            htmlFor="judgeme-reviewer-name"
            className="block font-medium text-gray-700 text-sm"
          >
            Seu Nome
            <span className="ml-1 text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            id="judgeme-reviewer-name"
            defaultValue=""
            placeholder="Digite seu nome"
            required
            className="w-full border border-gray-300 px-4 py-3 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="judgeme-reviewer-email"
            className="block font-medium text-gray-700 text-sm"
          >
            E-mail
            <span className="ml-1 text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            id="judgeme-reviewer-email"
            defaultValue=""
            placeholder="Digite seu e-mail"
            required
            className="w-full border border-gray-300 px-4 py-3 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        {/* Review Title */}
        <div className="space-y-2">
          <label
            htmlFor="judgeme-review-title"
            className="block font-medium text-gray-700 text-sm"
          >
            Título da avaliação
          </label>
          <input
            type="text"
            name="title"
            id="judgeme-review-title"
            defaultValue=""
            placeholder="Dê um título à sua avaliação"
            className="w-full border border-gray-300 px-4 py-3 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        {/* Review Body */}
        <div className="space-y-2">
          <label
            htmlFor="judgeme-review-body"
            className="block font-medium text-gray-700 text-sm"
          >
            Sua Avaliação
            <span className="ml-1 text-red-500">*</span>
          </label>
          <textarea
            name="body"
            id="judgeme-review-body"
            defaultValue=""
            required
            placeholder="Compartilhe sua experiência com este produto"
            rows={5}
            className="w-full border border-gray-300 px-4 py-3 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => setShowForm(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={formState === "submitting"}>
            {formState === "submitting" ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </div>
      </form>
    </div>
  );
}
