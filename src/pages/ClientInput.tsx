import { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import type { CalendarEvent } from '../types';
import { Plus, Trash2, Calendar as CalendarIcon, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

export const ClientInput = () => {
  const { events, addEvent, deleteEvent, updateEvent, currentClient } = useCalendar();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Separate state for the inline "Quick Add" form
  const [newEventData, setNewEventData] = useState<Partial<CalendarEvent>>({
    title: '',
    date: '',
    type: 'event',
    description: ''
  });

  // State for the modal (Edit only now, or could be used for complex adds if needed)
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    date: '',
    type: 'event',
    description: ''
  });

  const handleQuickAdd = () => {
    if (!newEventData.title || !newEventData.date || !newEventData.type) return;

    addEvent({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      clientId: currentClient?.id || '',
      title: newEventData.title!,
      date: newEventData.date!,
      type: newEventData.type as any,
      description: newEventData.description
    });

    setNewEventData({ title: '', date: '', type: 'event', description: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.type) return;

    if (editingId) {
      updateEvent({
        id: editingId,
        title: formData.title,
        date: formData.date,
        type: formData.type as any,
        description: formData.description
      } as CalendarEvent);
    }
    // We don't really use this for adding anymore, but keeping logic just in case
    
    setFormData({ title: '', date: '', type: 'event', description: '' });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleEdit = (event: CalendarEvent) => {
    setFormData({
      title: event.title,
      date: event.date,
      type: event.type,
      description: event.description || ''
    });
    setEditingId(event.id);
    setIsOpen(true);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'holiday': return 'bg-red-100 text-red-800';
      case 'promotion': return 'bg-green-100 text-green-800';
      case 'event': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Input Area</h2>
          <p className="text-gray-500">Manage upcoming events, promotions, and holidays.</p>
        </div>
      </div>

      {/* Form Modal or Inline */}
      {isOpen && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">{editingId ? 'Edit Event' : 'Add New Event'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                >
                  <option value="event">Event</option>
                  <option value="promotion">Promotion</option>
                  <option value="holiday">Holiday</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Inline Add Row */}
              <tr className="bg-primary-50/30">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    placeholder="New Event Title"
                    className="w-full px-2 py-1 border-b border-transparent focus:border-primary-500 bg-transparent focus:outline-none text-sm"
                    value={newEventData.title}
                    onChange={e => setNewEventData({...newEventData, title: e.target.value})}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="date"
                    className="w-full px-2 py-1 border-b border-transparent focus:border-primary-500 bg-transparent focus:outline-none text-sm text-gray-500"
                    value={newEventData.date}
                    onChange={e => setNewEventData({...newEventData, date: e.target.value})}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className="w-full px-2 py-1 border-b border-transparent focus:border-primary-500 bg-transparent focus:outline-none text-sm text-gray-500"
                    value={newEventData.type}
                    onChange={e => setNewEventData({...newEventData, type: e.target.value as any})}
                  >
                    <option value="event">Event</option>
                    <option value="promotion">Promotion</option>
                    <option value="holiday">Holiday</option>
                    <option value="other">Other</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    className="w-full px-2 py-1 border-b border-transparent focus:border-primary-500 bg-transparent focus:outline-none text-sm"
                    value={newEventData.description}
                    onChange={e => setNewEventData({...newEventData, description: e.target.value})}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={handleQuickAdd}
                    disabled={!newEventData.title || !newEventData.date}
                    className={`p-1 rounded-full transition-colors inline-flex items-center justify-center ${
                      newEventData.title && newEventData.date 
                        ? 'bg-primary-600 text-white hover:bg-primary-700' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </td>
              </tr>

              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                    No events yet. Use the row above to add one.
                  </td>
                </tr>
              ) : (
                events
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{event.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(event.type)}`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {event.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-primary-600 hover:text-primary-900 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200">
          {/* Inline Add Card */}
          <div className="p-4 bg-primary-50/30 space-y-3">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="New Event Title"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={newEventData.title}
                onChange={e => setNewEventData({...newEventData, title: e.target.value})}
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={newEventData.date}
                  onChange={e => setNewEventData({...newEventData, date: e.target.value})}
                />
                <select
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={newEventData.type}
                  onChange={e => setNewEventData({...newEventData, type: e.target.value as any})}
                >
                  <option value="event">Event</option>
                  <option value="promotion">Promo</option>
                  <option value="holiday">Holiday</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Description (optional)"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={newEventData.description}
                  onChange={e => setNewEventData({...newEventData, description: e.target.value})}
                />
                <button
                  onClick={handleQuickAdd}
                  disabled={!newEventData.title || !newEventData.date}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    newEventData.title && newEventData.date 
                      ? 'bg-primary-600 text-white hover:bg-primary-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No events yet. Add one above.
            </div>
          ) : (
            events
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((event) => (
              <div key={event.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <CalendarIcon className="w-4 h-4" />
                      {format(new Date(event.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(event.type)}`}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                </div>
                
                {event.description && (
                  <p className="text-sm text-gray-500">{event.description}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-900 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
