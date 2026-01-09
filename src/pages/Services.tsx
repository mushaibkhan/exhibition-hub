import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ServiceCategory } from '@/types/database';
import { Search, Sparkles, Package, Utensils, PlusCircle } from 'lucide-react';

const categoryColors: Record<ServiceCategory, string> = { sponsor: 'bg-purple-100 text-purple-800', signboard: 'bg-blue-100 text-blue-800', food_court: 'bg-orange-100 text-orange-800', add_on: 'bg-green-100 text-green-800' };
const categoryLabels: Record<ServiceCategory, string> = { sponsor: 'Sponsor', signboard: 'Signboard', food_court: 'Food Court', add_on: 'Add-on' };
const categoryIcons: Record<ServiceCategory, React.ElementType> = { sponsor: Sparkles, signboard: Package, food_court: Utensils, add_on: PlusCircle };

const Services = () => {
  const { services, isAdmin } = useMockData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredServices = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && (categoryFilter === 'all' || s.category === categoryFilter));
  const grouped = { sponsor: services.filter(s => s.category === 'sponsor'), signboard: services.filter(s => s.category === 'signboard'), food_court: services.filter(s => s.category === 'food_court'), add_on: services.filter(s => s.category === 'add_on') };

  return (
    <MockAppLayout title="Services" subtitle="Manage sellable services and add-ons">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {(Object.keys(grouped) as ServiceCategory[]).map(cat => { const Icon = categoryIcons[cat]; const rev = grouped[cat].reduce((s, x) => s + x.price * x.sold_quantity, 0); return (<Card key={cat}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">{categoryLabels[cat]}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{grouped[cat].length}</div>{isAdmin && <p className="text-xs text-muted-foreground">₹{rev.toLocaleString()}</p>}</CardContent></Card>); })}
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="sponsor">Sponsor</SelectItem><SelectItem value="signboard">Signboard</SelectItem><SelectItem value="food_court">Food Court</SelectItem><SelectItem value="add_on">Add-on</SelectItem></SelectContent></Select>
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead>{isAdmin && <TableHead>Price</TableHead>}<TableHead>Availability</TableHead></TableRow></TableHeader><TableBody>
          {filteredServices.map((s) => { const avail = s.is_unlimited ? '∞' : s.quantity - s.sold_quantity; const soldOut = !s.is_unlimited && s.sold_quantity >= s.quantity; return (<TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell><Badge className={categoryColors[s.category]}>{categoryLabels[s.category]}</Badge></TableCell><TableCell className="max-w-[200px] truncate text-muted-foreground">{s.description || '-'}</TableCell>{isAdmin && <TableCell>₹{s.price.toLocaleString()}</TableCell>}<TableCell>{soldOut ? <Badge variant="destructive">Sold Out</Badge> : <span className="text-sm">{avail} available</span>}</TableCell></TableRow>); })}
        </TableBody></Table></CardContent></Card>
      </div>
    </MockAppLayout>
  );
};

export default Services;
