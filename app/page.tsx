"use client"
import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';

interface Habit {
  id: number;
  name: string;
  goal: number;
  unit: string;
  data: { date: string; value: number }[];
}

const HabitTracker: FC = () => {
  const [habits, setHabits] = useState<Habit[]>([{
    id: 1,
    name: 'Drink Water',
    goal: 8,
    unit: 'glasses',
    data: []
  }, {
    id: 2,
    name: 'Sleep 8 hrs',
    goal: 8,
    unit: 'hours',
    data: []
  }, {
    id: 3,
    name: 'Screen Time < 2 hrs',
    goal: 2,
    unit: 'hours',
    data: []
  }]);

  const [showSettings, setShowSettings] = useState(false);
  const [alertInterval, setAlertInterval] = useState(60);
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
    alertIntervalRef.current = setInterval(() => {
      alert('⏰ Reminder: Don’t forget to log your habits today!');
    }, alertInterval * 60 * 1000);
    return () => {
      if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
    };
  }, [alertInterval]);

  const updateHabit = (id: number, value: number) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const updatedData = habit.data.filter(entry => entry.date !== today);
        return { ...habit, data: [...updatedData, { date: today, value }] };
      }
      return habit;
    }));
  };

  const getStreak = (data: { date: string; value: number }[], goal: number) => {
    let streak = 0;
    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const entry = data.find(d => d.date === date);
      if (entry && entry.value >= goal) streak++;
      else break;
    }
    return streak;
  };

  const cardClass = "bg-white text-black border border-black shadow rounded-lg p-6 m-2 hover:scale-[1.03] transition-transform";
  const inputClass = "w-full border border-black rounded px-3 py-2 bg-white text-black";
  const buttonClass = "mt-6 bg-white text-black border border-black px-4 py-2 rounded shadow hover:bg-black hover:text-white transition-colors";

  if (showSettings) {
    return (
      <div className="flex flex-col items-center p-4 space-y-6 w-full ">
        <h1 className="text-3xl font-bold mb-4">🛠️ Set Your Routine</h1>
        {habits.map(habit => (
          <div key={habit.id} className={cardClass}>
            <label className="block font-medium mb-1">{habit.name} Goal</label>
            <input
              type="number"
              min={1}
              value={habit.goal}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, goal: value } : h));
              }}
              className={inputClass}
            />
          </div>
        ))}

        <div className={cardClass}>
          <label className="block font-medium mb-1">Reminder Interval (minutes)</label>
          <input
            type="number"
            min={1}
            value={alertInterval}
            onChange={(e) => setAlertInterval(parseInt(e.target.value))}
            className={inputClass}
          />
        </div>

        <button
          className={buttonClass}
          onClick={() => setShowSettings(false)}
        >
          Save & Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 space-y-6 bg-white text-black">
      <div className="flex justify-between items-center w-full">
        <h1 className="text-3xl font-bold">Habit Tracker</h1>
        <button
          className="text-sm underline"
          onClick={() => setShowSettings(true)}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="w-full">
        <h2 className="text-xl font-semibold mb-2">📊 Weekly Progress</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={Array.from({ length: 7 }, (_, i) => {
              const date = dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
              const entry: { date: string; [habitName: string]: number | string } = { date };
              habits.forEach(habit => {
                const d = habit.data.find(h => h.date === date);
                entry[habit.name] = d ? d.value : 0;
              });
              return entry;
            })}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#000" />
            <XAxis dataKey="date" stroke="#000" />
            <YAxis stroke="#000" />
            <Tooltip contentStyle={{ backgroundColor: 'white', borderColor: 'black', color: 'black' }} />
            {habits.map(habit => (
              <Line key={habit.id} type="monotone" dataKey={habit.name} stroke="#000" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full space-y-4">
        {habits.map(habit => {
          const todayEntry = habit.data.find(d => d.date === today)?.value || 0;
          const streak = getStreak(habit.data, habit.goal);

          return (
            <div key={habit.id} className={cardClass}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{habit.name}</h2>
                <input
                  type="checkbox"
                  checked={todayEntry >= habit.goal}
                  onChange={(e) => updateHabit(habit.id, e.target.checked ? habit.goal : 0)}
                />
              </div>
              <p className="text-sm text-gray-800 mb-1">Goal: {habit.goal} {habit.unit}</p>

              <input
                type="range"
                min={0}
                max={habit.goal * 2}
                value={todayEntry}
                onChange={(e) => updateHabit(habit.id, parseInt(e.target.value))}
                className="w-full mt-2"
              />

              <div className="flex justify-between text-sm mt-1">
                <span>0 {habit.unit}</span>
                <span>{todayEntry} {habit.unit}</span>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold">🔥 Streak: {streak} day(s)</h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitTracker;
