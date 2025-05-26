
import Layout from '@/components/Layout';
import AIAssistant from '@/components/AIAssistant';

const Assistant = () => {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Research Assistant</h1>
        <p className="text-muted-foreground">
          Advanced medical AI assistant with 3D visualization capabilities
        </p>
      </div>
      
      <AIAssistant />
    </Layout>
  );
};

export default Assistant;
