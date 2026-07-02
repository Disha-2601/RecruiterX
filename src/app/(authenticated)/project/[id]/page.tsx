import ProjectWizard from '@/components/project/ProjectWizard';

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  return <ProjectWizard projectId={params.id} />;
}
