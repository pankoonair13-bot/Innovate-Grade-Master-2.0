"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LeaderboardEntry {
  id: string;
  participant_name: string;
  total_score: number;
}

export default function LeaderboardPage() {
  const [results, setResults] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('scores') // Make sure this matches your scores table name
        .select(`
          id,
          total_score,
          participants (name)
        `)
        .order('total_score', { ascending: false });

      if (!error && data) {
        // Format the data to handle the join with participants table
        const formattedData = data.map((item: any) => ({
          id: item.id,
          participant_name: item.participants?.name || 'Unknown',
          total_score: item.total_score || 0
        }));
        setResults(formattedData);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  // 🎨 COLOR LOGIC: Gold, Silver, Bronze
  const getMedalStyles = (score: number) => {
    if (score >= 80 && score <= 100) {
      return "bg-yellow-400 text-white border-yellow-500 shadow-md"; // Gold
    } else if (score >= 70 && score <= 79) {
      return "bg-slate-300 text-slate-800 border-slate-400"; // Silver
    } else if (score >= 60 && score <= 69) {
      return "bg-orange-400 text-white border-orange-500"; // Bronze
    } else {
      return "bg-white text-slate-500 border-slate-200"; // No Color (59 below)
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
            Live <span className="text-blue-600">Leaderboard</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">
            Innovate Grade Master 2.0
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest">Rank</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest">Participant Name</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Final Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="p-10 text-center font-bold text-slate-400">Loading Rankings...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={3} className="p-10 text-center font-bold text-slate-400">No scores recorded yet.</td></tr>
              ) : (
                results.map((entry, index) => (
                  <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-900 font-black text-xs">
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-6">
                      <p className="font-bold text-slate-800">{entry.participant_name}</p>
                    </td>
                    <td className="p-6 text-right">
                      <span className={`inline-block px-5 py-2 rounded-2xl border-2 font-black text-sm transition-all ${getMedalStyles(entry.total_score)}`}>
                        {entry.total_score.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}