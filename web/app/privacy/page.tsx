import MdxLayout from '@/components/MdxLayout';
import Content from '@/content/privacy.mdx';

export const metadata = {
  title: 'Privacy Policy — Yu-Jin',
};

export default function PrivacyPage() {
  return (
    <MdxLayout>
      <Content />
    </MdxLayout>
  );
}
