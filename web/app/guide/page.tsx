import MdxLayout from '@/components/MdxLayout';
import Content from '@/content/guide.mdx';

export const metadata = {
  title: 'User Guide — Yu-Jin',
};

export default function GuidePage() {
  return (
    <MdxLayout>
      <Content />
    </MdxLayout>
  );
}
