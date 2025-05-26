
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Save, Download, Upload, FileText, Calendar, Tag, RefreshCw, ArrowRightCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { groqService } from '@/services/groqService';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  
  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('medxrchain-notes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }));
        setNotes(parsedNotes);
      } catch (error) {
        console.error('Error parsing saved notes:', error);
      }
    }
  }, []);
  
  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('medxrchain-notes', JSON.stringify(notes));
    }
  }, [notes]);
  
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleCreateNote = () => {
    if (!newNote.title.trim()) {
      toast({
        variant: "destructive",
        title: "Title Required",
        description: "Please provide a title for your note."
      });
      return;
    }
    
    const now = new Date();
    const tagArray = newNote.tags
      ? newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      : [];
    
    const note: Note = {
      id: `note-${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      tags: tagArray,
      createdAt: now,
      updatedAt: now
    };
    
    setNotes([...notes, note]);
    setNewNote({ title: '', content: '', tags: '' });
    setShowCreateDialog(false);
    
    toast({
      title: "Note Created",
      description: "Your note has been saved."
    });
  };
  
  const handleUpdateNote = () => {
    if (!selectedNote) return;
    
    setNotes(notes.map(note => 
      note.id === selectedNote.id
        ? { ...selectedNote, updatedAt: new Date() }
        : note
    ));
    
    toast({
      title: "Note Updated",
      description: "Your changes have been saved."
    });
  };
  
  const handleDeleteNote = () => {
    if (!selectedNote) return;
    
    setNotes(notes.filter(note => note.id !== selectedNote.id));
    setSelectedNote(null);
    setShowDeleteDialog(false);
    
    toast({
      title: "Note Deleted",
      description: "The note has been removed."
    });
  };
  
  const exportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'medxrchain-notes.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Notes Exported",
      description: "Your notes have been exported to a JSON file."
    });
  };
  
  const importNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedNotes = JSON.parse(content).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }));
        
        setNotes([...notes, ...importedNotes]);
        
        toast({
          title: "Notes Imported",
          description: `Successfully imported ${importedNotes.length} notes.`
        });
      } catch (error) {
        console.error('Error importing notes:', error);
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: "Invalid file format. Please use a valid JSON export."
        });
      }
    };
    reader.readAsText(file);
  };
  
  const analyzeNoteWithAI = async () => {
    if (!selectedNote) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await groqService.chat([
        {
          role: "system",
          content: "You are an AI assistant that analyzes medical notes and provides concise, clinically relevant summaries."
        },
        {
          role: "user",
          content: `Please analyze the following medical note and provide a concise summary highlighting key medical points, potential diagnoses, and follow-up recommendations:\n\nTitle: ${selectedNote.title}\n\nContent: ${selectedNote.content}`
        }
      ]);
      
      setAiSummary(response);
    } catch (error) {
      console.error('Error analyzing note with AI:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not analyze the note. Please check your API key in settings."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Generate a simple force-directed graph visualization
  const GraphView = () => {
    useEffect(() => {
      if (viewMode !== 'graph' || notes.length === 0) return;
      
      // Get the container dimensions
      const container = document.getElementById('graph-container');
      if (!container) return;
      
      const width = container.clientWidth;
      const height = 400;
      
      // Clear any existing SVG
      container.innerHTML = '';
      
      // Create SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', width.toString());
      svg.setAttribute('height', height.toString());
      container.appendChild(svg);
      
      // Extract all unique tags
      const allTags = new Set<string>();
      notes.forEach(note => note.tags.forEach(tag => allTags.add(tag)));
      
      // Create nodes for notes and tags
      const noteNodes = notes.map((note, index) => ({
        id: note.id,
        label: note.title,
        type: 'note',
        radius: 20,
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 100) + 50,
        color: '#e91e63'
      }));
      
      const tagNodes = Array.from(allTags).map((tag, index) => ({
        id: `tag-${tag}`,
        label: tag,
        type: 'tag',
        radius: 15,
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 100) + 50,
        color: '#2196f3'
      }));
      
      const nodes = [...noteNodes, ...tagNodes];
      
      // Create links between notes and their tags
      const links: { source: string; target: string }[] = [];
      
      notes.forEach(note => {
        note.tags.forEach(tag => {
          links.push({
            source: note.id,
            target: `tag-${tag}`
          });
        });
      });
      
      // Draw links first (so they're behind the nodes)
      links.forEach(link => {
        const sourceNode = nodes.find(node => node.id === link.source);
        const targetNode = nodes.find(node => node.id === link.target);
        
        if (sourceNode && targetNode) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', sourceNode.x.toString());
          line.setAttribute('y1', sourceNode.y.toString());
          line.setAttribute('x2', targetNode.x.toString());
          line.setAttribute('y2', targetNode.y.toString());
          line.setAttribute('stroke', '#ddd');
          line.setAttribute('stroke-width', '1');
          svg.appendChild(line);
        }
      });
      
      // Draw nodes
      nodes.forEach(node => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create circle for node
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x.toString());
        circle.setAttribute('cy', node.y.toString());
        circle.setAttribute('r', node.radius.toString());
        circle.setAttribute('fill', node.color);
        
        // Add text label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x.toString());
        text.setAttribute('y', (node.y + node.radius + 12).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#555');
        text.setAttribute('font-size', '10');
        text.textContent = node.label;
        
        group.appendChild(circle);
        group.appendChild(text);
        
        // Add click handler to select the note
        if (node.type === 'note') {
          group.style.cursor = 'pointer';
          group.addEventListener('click', () => {
            const clickedNote = notes.find(note => note.id === node.id);
            if (clickedNote) {
              setSelectedNote(clickedNote);
            }
          });
        }
        
        svg.appendChild(group);
      });
      
    }, [viewMode, notes]);
    
    return (
      <div id="graph-container" className="h-[400px] border rounded-lg bg-white dark:bg-gray-900">
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="h-10 w-10 mb-2 opacity-20" />
            <p>No notes to visualize</p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Layout>
      <div className="w-full animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Medical Notes</h1>
            <p className="text-muted-foreground">Create, organize, and analyze medical notes</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-end">
            <Button 
              variant="default" 
              className="gap-2 bg-pink-600 hover:bg-pink-700"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              New Note
            </Button>
            
            <Button variant="outline" className="gap-2" onClick={exportNotes}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button variant="outline" className="gap-2" asChild>
              <label>
                <Upload className="h-4 w-4" />
                Import
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".json" 
                  onChange={importNotes} 
                />
              </label>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Notes list panel */}
          <div className="md:w-1/3 flex flex-col space-y-4">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-950 border rounded-md px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium">All Notes ({filteredNotes.length})</h2>
              <div className="flex gap-1">
                <Button 
                  variant="ghost"
                  size="sm" 
                  className={`p-1 h-8 w-8 ${viewMode === 'list' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost"
                  size="sm" 
                  className={`p-1 h-8 w-8 ${viewMode === 'graph' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('graph')}
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {viewMode === 'list' ? (
              <div className="flex-1 overflow-auto">
                {filteredNotes.length > 0 ? (
                  <div className="space-y-2">
                    {filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${selectedNote?.id === note.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : ''}`}
                        onClick={() => setSelectedNote(note)}
                      >
                        <h3 className="font-medium truncate">{note.title}</h3>
                        <div className="flex items-center text-muted-foreground text-xs mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className="px-1.5 py-0.5 bg-muted text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <FileText className="h-10 w-10 mb-2 opacity-20" />
                    {searchTerm ? (
                      <p>No notes match your search</p>
                    ) : (
                      <p>No notes yet. Click "New Note" to create one.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <GraphView />
            )}
          </div>
          
          {/* Note editor panel */}
          <div className="md:w-2/3">
            {selectedNote ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium">{selectedNote.title}</h2>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={analyzeNoteWithAI}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRightCircle className="h-4 w-4" />}
                      {isAnalyzing ? "Analyzing..." : "AI Analysis"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-4">
                    <Textarea
                      value={selectedNote.content}
                      onChange={(e) => setSelectedNote({...selectedNote, content: e.target.value})}
                      className="min-h-[300px] font-mono"
                    />
                    
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <Label htmlFor="tags" className="text-xs">Tags (comma separated)</Label>
                        <Input
                          id="tags"
                          value={selectedNote.tags.join(', ')}
                          onChange={(e) => setSelectedNote({
                            ...selectedNote, 
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
                          })}
                          placeholder="e.g. cardiology, urgent, followup"
                        />
                      </div>
                      <Button onClick={handleUpdateNote}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Note Details</h3>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="ml-2">
                            {selectedNote.createdAt.toLocaleDateString()} at {selectedNote.createdAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Updated:</span>
                          <span className="ml-2">
                            {selectedNote.updatedAt.toLocaleDateString()} at {selectedNote.updatedAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Word count:</span>
                          <span className="ml-2">{selectedNote.content.split(/\s+/).filter(word => word.length > 0).length}</span>
                        </div>
                      </div>
                      
                      {aiSummary && (
                        <div className="mt-4 pt-4 border-t">
                          <h3 className="font-medium mb-2">AI Analysis</h3>
                          <div className="text-sm bg-muted p-3 rounded-md">
                            {aiSummary}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <FileText className="h-10 w-10 mb-4 opacity-20" />
                <p className="text-lg">Select a note to view and edit</p>
                <p className="text-sm mt-2">Or create a new note using the button above</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Note Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">Title</Label>
              <Input
                id="title"
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                placeholder="Note title"
              />
            </div>
            
            <div>
              <Label htmlFor="content" className="text-sm font-medium">Content</Label>
              <Textarea
                id="content"
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                placeholder="Write your note here..."
                className="min-h-[200px]"
              />
            </div>
            
            <div>
              <Label htmlFor="new-tags" className="text-sm font-medium">Tags (comma separated)</Label>
              <Input
                id="new-tags"
                value={newNote.tags}
                onChange={(e) => setNewNote({...newNote, tags: e.target.value})}
                placeholder="e.g. cardiology, urgent, followup"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote}>
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this note? This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteNote}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Notes;
