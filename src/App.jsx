import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [applications, setApplications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: '',
    company: '',
    role: '',
    match: '',
    status: 'Applied',
    followup: '',
    salary: '',
    tags: '',
    link: '',
    notes: '',
  });

  // Load applications from Supabase
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading applications:', error);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const openModal = () => {
    setFormData({ ...formData, date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      date: '',
      company: '',
      role: '',
      match: '',
      status: 'Applied',
      followup: '',
      salary: '',
      tags: '',
      link: '',
      notes: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newApp = {
      date: formData.date,
      company: formData.company,
      role: formData.role,
      match: parseInt(formData.match),
      status: formData.status,
      followup: formData.followup || null,
      salary: formData.salary || null,
      tags: formData.tags || null,
      link: formData.link || null,
      notes: formData.notes || null,
    };

    const { error } = await supabase.from('applications').insert([newApp]);

    if (error) {
      console.error('Error adding application:', error);
      alert('Error adding application. Please try again.');
    } else {
      loadApplications(); // Reload data
      closeModal();
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const deleteApp = async (id) => {
    if (window.confirm('Delete this application?')) {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting application:', error);
        alert('Error deleting application. Please try again.');
      } else {
        loadApplications(); // Reload data
      }
    }
  };

  const exportToCSV = () => {
    if (applications.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Date',
      'Company',
      'Role',
      'Match Score',
      'Status',
      'Follow-up',
      'Salary',
      'Tags',
      'Link',
      'Notes',
    ];
    const rows = applications.map((a) => [
      a.date,
      a.company,
      a.role,
      a.match,
      a.status,
      a.followup,
      a.salary,
      a.tags,
      a.link,
      a.notes,
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell || ''}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-applications-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    a.click();
  };

  const clearAll = async () => {
    if (window.confirm('Clear all applications? This cannot be undone.')) {
      const { error } = await supabase
        .from('applications')
        .delete()
        .neq('id', 0); // Delete all

      if (error) {
        console.error('Error clearing applications:', error);
        alert('Error clearing applications. Please try again.');
      } else {
        loadApplications(); // Reload data
      }
    }
  };

  const getMatchClass = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusClass = (status) => {
    const classes = {
      Applied: 'bg-blue-100 text-blue-800',
      Interviewing: 'bg-orange-100 text-orange-800',
      Offer: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Withdrawn: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || classes.Applied;
  };

  const stats = {
    total: applications.length,
    interviews: applications.filter(
      (a) => a.status === 'Interviewing' || a.status === 'Offer'
    ).length,
    responseRate:
      applications.length > 0
        ? Math.round(
            (applications.filter((a) => a.status !== 'Applied').length /
              applications.length) *
              100
          )
        : 0,
    avgMatch:
      applications.length > 0
        ? Math.round(
            applications.reduce((sum, a) => sum + a.match, 0) /
              applications.length
          )
        : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8">
          <h1 className="text-3xl font-bold mb-2">Job Application Tracker</h1>
          <p className="opacity-90">Omar AlMalky - 2025 Job Search</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-4">
              <h3 className="text-sm opacity-90 mb-1">Total Applications</h3>
              <div className="text-3xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-4">
              <h3 className="text-sm opacity-90 mb-1">Interviews</h3>
              <div className="text-3xl font-bold">{stats.interviews}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-4">
              <h3 className="text-sm opacity-90 mb-1">Response Rate</h3>
              <div className="text-3xl font-bold">{stats.responseRate}%</div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-4">
              <h3 className="text-sm opacity-90 mb-1">Avg Match Score</h3>
              <div className="text-3xl font-bold">{stats.avgMatch}%</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 flex gap-3 flex-wrap">
          <button
            onClick={openModal}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
          >
            + Add Application
          </button>
          <button
            onClick={exportToCSV}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Export CSV
          </button>
          <button
            onClick={clearAll}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Clear All
          </button>
        </div>

        <div className="overflow-x-auto p-8">
          {applications.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg
                className="w-20 h-20 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">
                No applications yet
              </h3>
              <p>
                Click &quot;Add Application&quot; to start tracking your job
                search
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    Company
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    Match
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    Follow-up
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    Salary
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    Tags
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3">
                      {new Date(app.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-3 font-semibold">{app.company}</td>
                    <td className="py-3 px-3">{app.role}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${getMatchClass(app.match)}`}
                      >
                        {app.match}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {app.followup
                        ? new Date(app.followup).toLocaleDateString('en-GB')
                        : '-'}
                    </td>
                    <td className="py-3 px-3">{app.salary || '-'}</td>
                    <td className="py-3 px-3 text-xs text-gray-600">
                      {app.tags || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        {app.link && (
                          <a
                            href={app.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <button className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">
                              View
                            </button>
                          </a>
                        )}
                        <button
                          onClick={() => deleteApp(app.id)}
                          className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">Add Application</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Date*
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name*
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Mach49, Amazon, McKinsey"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Title*
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Operations Manager, Product Manager"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Match Score (%)*
                  </label>
                  <input
                    type="number"
                    name="match"
                    value={formData.match}
                    onChange={handleInputChange}
                    required
                    min="0"
                    max="100"
                    placeholder="60-100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status*
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    name="followup"
                    value={formData.followup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="e.g., SAR 20K-25K"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., High Priority, Market Entry, Referral"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Link
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Key points, contacts, insights..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Add Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
