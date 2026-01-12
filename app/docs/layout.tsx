import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - Donation Book',
  description: 'Complete guide to using Donation Book for managing festival donations and expenses',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
