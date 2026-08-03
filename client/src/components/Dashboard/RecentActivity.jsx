import React from "react";

const activities = [
  {
    id: 1,
    text: "You joined Project Alpha",
    time: "2 hours ago",
  },
  {
    id: 2,
    text: "Edited the collaborative whiteboard",
    time: "Yesterday",
  },
  {
    id: 3,
    text: "Created a new project",
    time: "2 days ago",
  },
];

const RecentActivity = () => {
  return (
    <section className="recent-activity">

      <h2>Recent Activity</h2>

      <div className="activity-list">

        {activities.map((activity) => (
          <div
            key={activity.id}
            className="activity-item"
          >
            <div>

              <p>{activity.text}</p>

              <small>{activity.time}</small>

            </div>
          </div>
        ))}

      </div>

    </section>
  );
};

export default RecentActivity;