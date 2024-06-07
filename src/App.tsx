// Мы ожидаем, что Вы исправите синтаксические ошибки, сделаете перехват возможных исключений и улучшите читаемость кода.
// А так же, напишите кастомный хук useThrottle и используете его там где это нужно.
// Желательно использование React.memo и React.useCallback там где это имеет смысл.
// Будет большим плюсом, если Вы сможете закэшировать получение случайного пользователя.
// Укажите правильные типы.
// По возможности пришлите Ваш вариант в https://codesandbox.io

import React, { memo, useCallback, useRef, useState } from "react";

const URL = "https://jsonplaceholder.typicode.com/users";

type TCompany = {
  bs: string;
  catchPhrase: string;
  name: string;
};

interface IGeo {
  lat: string;
  lng: string;
}

interface IAdress {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: IGeo;
}

type TUser = {
  id: number;
  email: string;
  name: string;
  phone: string;
  username: string;
  website: string;
  company: TCompany;
  address: IAdress;
};

interface IButtonProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

const Button = memo(function Button({ onClick }: IButtonProps): JSX.Element {
  return (
    <button type="button" onClick={onClick}>
      get random user
    </button>
  );
});

interface IUserInfoProps {
  user: TUser;
}

const UserInfo = memo(function UserInfo({ user }: IUserInfoProps): JSX.Element {
  return (
    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Phone number</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{user.name}</td>
          <td>{user.phone}</td>
        </tr>
      </tbody>
    </table>
  );
});

function useThrottle() {
  const timer = useRef<number | null>(null);

  return (action: () => void) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      action();
    }, 500);
  };
}

function App(): JSX.Element {
  const [item, setItem] = useState<Record<number, TUser>>({});
  const idsRef = useRef<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trottle = useThrottle();

  const getUser = useCallback(async (id: number) => {
    const response = await fetch(`${URL}/${id}`);
    const _user = (await response.json()) as TUser;
    return _user;
  }, []);

  const receiveRandomUser = useCallback(() => {
    const randomId = Math.floor(Math.random() * (10 - 1)) + 1;
    if (!idsRef.current.includes(randomId)) {
      getUser(randomId)
        .then((user) => {
          const { id } = user;
          if (id) {
            idsRef.current.push(id);
            setItem((prevState) => ({ ...prevState, [id]: user }));
            setCurrent(id);
          } else {
            setError("No new user has been received.");
          }
        })
        .catch((e) => {
          setError("Data receiving error:" + e.message);
        });
    } else {
      setCurrent(randomId);
    }
  }, [getUser]);

  const handleButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();
      trottle(receiveRandomUser);
    },
    [trottle, receiveRandomUser]
  );

  return (
    <div>
      <header>Get a random user</header>
      {error}
      <Button onClick={handleButtonClick} />
      {current && !error ? (
        <UserInfo user={item[current]} />
      ) : (
        <div>No current user</div>
      )}
    </div>
  );
}

export default App;